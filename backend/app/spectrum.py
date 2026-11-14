"""Real 102-channel SPHEREx spectra.

A Level-2 SPHEREx image is a long-slit spectrum: the wavelength runs along the
detector Y axis (WAVE-TAB), while X stays spatial. Extracting one object's
spectrum therefore means walking every row, summing a small aperture around the
object's column after subtracting that row's local sky background, and averaging
those row fluxes into the 102 SPHEREx channels.

Reading the plane is the expensive part (~17 MB per detector), so the six
detectors are fetched in parallel and the extracted spectrum is cached.
"""

from __future__ import annotations

import math
import warnings
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import numpy as np

from .cache import cache
from .config import ARRAY_RANGES_UM, CHANNEL_EDGES_UM
from .images import product_meta, read_window, wcs_for, wavelength_at
from .sia import SEARCH_RADIUS_DEG
from .sia import coverage as coverage_report

APERTURE_ARCSEC = 15.0
SPECTRUM_CACHE_TTL = 30 * 24 * 60 * 60


def _extract_detector(entry: dict[str, Any], ra: float, dec: float, edges: np.ndarray) -> tuple[np.ndarray, np.ndarray] | None:
    url = entry["url"]
    meta = product_meta(url)
    in_wcs = wcs_for(url)
    px, py = in_wcs.all_world2pix(np.array([ra]), np.array([dec]), 0)
    cx, cy = float(px[0]), float(py[0])
    if not (math.isfinite(cx) and math.isfinite(cy)):
        return None

    naxis1, naxis2 = meta["naxis1"], meta["naxis2"]
    if not (0 <= cx < naxis1 and 0 <= cy < naxis2):
        return None

    # Whole plane: the spectrum spans every row.
    plane = read_window(url, meta["datLoc"], naxis1, meta["bitpix"], 0, naxis2, 0, naxis1)
    plane = np.asarray(plane, dtype=np.float32)

    radius_px = max(1.5, APERTURE_ARCSEC / 6.15)
    half = int(math.ceil(radius_px))
    center = int(round(cx))
    x0 = max(center - half, 0)
    x1 = min(center + half + 1, naxis1)
    if x1 <= x0:
        return None

    rows = np.arange(naxis2)
    lam_rows, _bw = wavelength_at(meta, np.full_like(rows, float(center)), rows.astype(float))
    bins = np.digitize(lam_rows, edges) - 1
    valid = (bins >= 0) & (bins < len(edges) - 1)

    strip = plane[:, x0:x1]
    finite = np.isfinite(strip)
    aperture_sum = np.where(finite, strip, 0.0).sum(axis=1)
    aperture_n = finite.sum(axis=1)

    # Each row is one wavelength sample, so a local background can be measured
    # on that same row just outside the aperture. Subtracting it keeps the sky
    # level out of the spectrum and makes the result depend on the clicked
    # position instead of on the full detector column.
    bg_half = max(half * 4, half + 4)
    bg_x0 = max(center - bg_half, 0)
    bg_x1 = min(center + bg_half + 1, naxis1)
    bg_strip = plane[:, bg_x0:bg_x1]
    bg_mask = np.ones(bg_strip.shape, dtype=bool)
    cut0 = max(x0 - bg_x0, 0)
    cut1 = min(x1 - bg_x0, bg_x1 - bg_x0)
    if cut1 > cut0:
        bg_mask[:, cut0:cut1] = False
    background = np.where(bg_mask & np.isfinite(bg_strip), bg_strip, np.nan)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        row_bg = np.nanmedian(background, axis=1)
    row_bg = np.where(np.isfinite(row_bg), row_bg, 0.0).astype(np.float64)
    row_flux = aperture_sum - row_bg * aperture_n

    pixel_sr = (6.15 / 3600.0 * math.pi / 180.0) ** 2
    n_channels = len(edges) - 1
    counts = np.bincount(bins[valid], minlength=n_channels).astype(float)
    # A channel that covers more rows must not look brighter: average the
    # per-row fluxes instead of summing them.
    flux = np.bincount(bins[valid], weights=row_flux[valid], minlength=n_channels)
    flux = flux / np.maximum(counts, 1.0)
    return flux * pixel_sr, counts


def spectrum(
    ra: float,
    dec: float,
    fov: float,
    epoch: int,
    *,
    field_ra: float | None = None,
    field_dec: float | None = None,
) -> dict[str, Any] | None:
    # Epoch indices come from the workspace's field-centred coverage report, so
    # resolve products there whenever the caller supplies the field centre; the
    # clicked point is then only used for the aperture. If that report is not
    # covered, widen the cone around the point itself (a click can sit close to
    # the edge of a large field).
    data = (
        coverage_report(field_ra, field_dec, fov)
        if field_ra is not None and field_dec is not None
        else coverage_report(ra, dec, fov)
    )
    if not data["covered"]:
        data = coverage_report(ra, dec, fov, radius_deg=max(SEARCH_RADIUS_DEG, fov * 0.6))
    if not data["covered"] or epoch >= len(data["epochs"]):
        return None

    key = cache.key("spectrum-v3", round(ra, 5), round(dec, 5), round(fov, 3), epoch)
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    edges = np.asarray(CHANNEL_EDGES_UM, dtype=float)
    n_channels = len(edges) - 1
    flux = np.zeros(n_channels)
    counts = np.zeros(n_channels)
    detectors_used: list[int] = []
    mjd = data["epochs"][epoch]["mjd"]

    entries = list(data["epochs"][epoch]["detectors"].items())
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {
            int(detector): pool.submit(_extract_detector, entry, ra, dec, edges)
            for detector, entry in entries
        }
        for detector, future in futures.items():
            try:
                result = future.result()
            except Exception:  # noqa: BLE001 - a bad product must not kill the spectrum
                continue
            if result is None:
                continue
            detector_flux, detector_counts = result
            flux += detector_flux
            counts += detector_counts
            detectors_used.append(detector)

    if not detectors_used:
        return None

    wavelengths = (edges[:-1] + edges[1:]) / 2
    mjy = flux * 1e9
    payload = {
        "ra": ra,
        "dec": dec,
        "epoch": epoch,
        "mjd": mjd,
        "wavelength": wavelengths.tolist(),
        "flux": [None if counts[i] == 0 else float(mjy[i]) for i in range(n_channels)],
        "npix": counts.astype(int).tolist(),
        "detectors": sorted(detectors_used),
        "unit": "mJy",
        "apertureArcsec": APERTURE_ARCSEC,
        "method": "per-row aperture photometry, background subtracted (WAVE-TAB)",
        "arrays": [
            {"index": index + 1, "low": low, "high": high}
            for index, (low, high) in enumerate(ARRAY_RANGES_UM)
        ],
    }
    cache.put_json(key, payload, ttl=SPECTRUM_CACHE_TTL)
    return payload
