"""Real multi-visit SPHEREx spectra.

A Level-2 SPHEREx file is a *spectral image*: the linear variable filter puts
a different wavelength on every detector row, so one exposure measures each sky
position in exactly **one** of the 102 spectral channels. The survey revisits
every position in every channel at least four times by repointing the
spacecraft. A source spectrum therefore cannot be read out of a single
exposure (walking rows at fixed x mixes unrelated sky positions at different
wavelengths, which is what the previous "column scan" did). It is built the way
the IRSA Spectrophotometry Tool and the community pipelines do it: measure the
source in every visit that covers it and plot flux against the wavelength of
that visit.

Each visit contributes:

* a small cutout around the target (IMAGE),
* the official channel index of the target pixel (``spectral_channels`` map),
* aperture photometry with a local background annulus,
* an uncertainty from the VARIANCE extension plus the annulus scatter,
* the FLAGS bitmask, propagated to the measurement.

Surface brightness is converted to a flux density with the local pixel solid
angle from the SIP-aware WCS, giving uJy per channel.
"""

from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import numpy as np

from .cache import cache
from .channels import channel_at_pixels, channel_for_wavelength, channel_rows
from .channels_data import CHANNELS
from .config import SIA_COLLECTIONS
from .images import (
    pixel_solid_angle,
    product_meta,
    read_flags_window,
    read_variance_window,
    read_window,
    wavelength_at,
    wcs_for,
)
from .sia import (
    SEARCH_RADIUS_DEG,
    _detector_from_row,
    _float,
    _s3_url,
    build_visits,
    query_sia,
)

APERTURE_FWHM = 2.0
ANNULUS_INNER_FWHM = 3.5
ANNULUS_OUTER_FWHM = 10.0
DEFAULT_MAX_PRODUCTS = 96
HARD_MAX_PRODUCTS = 900
SPECTRUM_CACHE_TTL = 30 * 24 * 60 * 60
CONTAMINATION_MASK = 0x1F  # same "do not trust this pixel" bits the worker tints

_CHANNEL_BY_INDEX = {
    (row[0] - 1) * 17 + row[1]: row for row in CHANNELS
}


def _channel_label(channel: int | None) -> str | None:
    if not channel or channel < 1 or channel > 102:
        return None
    row = _CHANNEL_BY_INDEX.get(channel)
    if row is None:
        return None
    return f"D{row[0]}-{row[1]:02d}"


def _aperture_geometry(
    shape: tuple[int, int], x0: int, y0: int, cx: float, cy: float, ap_radius: float, ann_inner: float, ann_outer: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[y0 : y0 + shape[0], x0 : x0 + shape[1]].astype(np.float64)
    radius = np.hypot(xx - cx, yy - cy)
    return radius <= ap_radius, (radius >= ann_inner) & (radius <= ann_outer), radius


def _centroid(
    plane: np.ndarray,
    x0: int,
    y0: int,
    cx: float,
    cy: float,
    background: float,
    scatter: float,
    *,
    search_px: float = 5.0,
    significance: float = 4.0,
) -> tuple[float, float, bool]:
    """Re-centre on the source inside a small search radius.

    Proper motion is the reason this exists: Barnard's Star moves 10.3"/yr, so
    between two visits its position can shift by several pixels. The Explorer
    measures the source where it actually is in each visit instead of assuming
    the click position holds for every epoch.
    """

    if not np.isfinite(scatter) or scatter <= 0:
        return cx, cy, False
    yy, xx = np.mgrid[y0 : y0 + plane.shape[0], x0 : x0 + plane.shape[1]].astype(np.float64)
    distance = np.hypot(xx - cx, yy - cy)
    search = distance <= search_px
    if not search.any():
        return cx, cy, False
    values = np.where(search & np.isfinite(plane), plane, -np.inf)
    index = np.unravel_index(int(np.argmax(values)), values.shape)
    if not np.isfinite(values[index]) or values[index] - background < significance * scatter:
        return cx, cy, False

    patch = plane[
        max(0, index[0] - 1) : index[0] + 2, max(0, index[1] - 1) : index[1] + 2
    ]
    weights = np.clip(patch - background, 0.0, None)
    if not np.isfinite(weights).all() or weights.sum() <= 0:
        return x0 + index[1], y0 + index[0], True
    yy_patch, xx_patch = np.mgrid[
        max(0, index[0] - 1) : index[0] + 2, max(0, index[1] - 1) : index[1] + 2
    ]
    return (
        float((weights * xx_patch).sum() / weights.sum() + x0),
        float((weights * yy_patch).sum() / weights.sum() + y0),
        True,
    )


def _photometry(
    url: str,
    ra: float,
    dec: float,
    *,
    flags_requested: bool = True,
) -> dict[str, Any] | None:
    """One visit: aperture photometry of the target in a single spectral image."""

    meta = product_meta(url)
    wcs = wcs_for(url)
    px, py = wcs.all_world2pix(np.array([ra]), np.array([dec]), 0)
    cx, cy = float(px[0]), float(py[0])
    naxis1, naxis2 = meta["naxis1"], meta["naxis2"]
    if not (math.isfinite(cx) and math.isfinite(cy)):
        return None
    if not (0 <= cx < naxis1 and 0 <= cy < naxis2):
        return None

    fwhm_arcsec = float(meta["header"].get("PSF_FWHM") or 6.0)
    scale = 6.15
    try:
        from .images import pixel_scale_arcsec

        scale = pixel_scale_arcsec(url)
    except Exception:  # noqa: BLE001 - nominal sampling is fine for a radius
        pass
    fwhm_px = max(1.0, fwhm_arcsec / scale)
    ap_radius = max(1.5, APERTURE_FWHM * fwhm_px)
    ann_inner = max(ap_radius + 1.0, ANNULUS_INNER_FWHM * fwhm_px)
    ann_outer = max(ann_inner + 2.0, ANNULUS_OUTER_FWHM * fwhm_px)

    half = int(math.ceil(ann_outer)) + 2
    x0 = max(0, int(math.floor(cx)) - half)
    x1 = min(naxis1, int(math.ceil(cx)) + half + 1)
    y0 = max(0, int(math.floor(cy)) - half)
    y1 = min(naxis2, int(math.ceil(cy)) + half + 1)
    if x1 - x0 < 5 or y1 - y0 < 5:
        return None

    plane = np.asarray(
        read_window(url, meta["datLoc"], naxis1, meta["bitpix"], y0, y1, x0, x1),
        dtype=np.float64,
    )
    variance_window = read_variance_window(url, y0, y1, x0, x1)
    variance = (
        np.asarray(variance_window, dtype=np.float64)
        if variance_window is not None
        else None
    )

    shape = (y1 - y0, x1 - x0)
    _, annulus, _ = _aperture_geometry(shape, x0, y0, cx, cy, ap_radius, ann_inner, ann_outer)
    good = np.isfinite(plane)
    ann_values = plane[annulus & good]
    if ann_values.size < 8:
        return None
    background = float(np.median(ann_values))
    scatter = float(1.4826 * np.median(np.abs(ann_values - background)))

    centred_x, centred_y, recentred = _centroid(
        plane, x0, y0, cx, cy, background, scatter
    )
    aperture, annulus, _ = _aperture_geometry(
        shape, x0, y0, centred_x, centred_y, ap_radius, ann_inner, ann_outer
    )
    ann_values = plane[annulus & good]
    if ann_values.size >= 8:
        background = float(np.median(ann_values))
        scatter = float(1.4826 * np.median(np.abs(ann_values - background)))

    ap_values = plane[aperture & good]
    if ap_values.size < 3:
        return None

    flux_sr = float(np.sum(ap_values) - ap_values.size * background)

    if variance is not None:
        ap_variance = variance[aperture & good]
        noise_sr2 = float(np.nansum(np.maximum(ap_variance, 0.0)))
    else:
        noise_sr2 = 0.0
    noise_sr2 += ap_values.size * scatter**2
    noise_sr = math.sqrt(max(noise_sr2, 0.0))

    solid_angle = pixel_solid_angle(url, centred_x, centred_y)
    # MJy/sr -> uJy: 1e6 (MJy -> Jy) * 1e6 (Jy -> uJy) * solid angle.
    to_ujy = solid_angle * 1e12
    flux = flux_sr * to_ujy
    flux_error = noise_sr * to_ujy

    flags = 0
    flag_fraction = 0.0
    if flags_requested:
        try:
            flag_window = read_flags_window(url, y0, y1, x0, x1)
            ap_flags = np.asarray(flag_window, dtype=np.uint32)[aperture]
            if ap_flags.size:
                flags = int(np.bitwise_or.reduce(ap_flags))
                flag_fraction = float(np.mean((ap_flags & CONTAMINATION_MASK) != 0))
        except Exception:  # noqa: BLE001 - flags are metadata
            flags = 0
            flag_fraction = 0.0

    channel_values = channel_at_pixels(
        np.array([centred_x]), np.array([centred_y]), (naxis2, naxis1)
    )
    detector = int(meta.get("detector") or 0)
    if channel_values is not None:
        subchan = int(channel_values[0])
    else:
        # Fallback: derive the channel from the WAVE-TAB wavelength when the
        # official calibration map is unavailable.
        subchan = 0
        if "wave" in meta:
            try:
                lam, _bandwidth = wavelength_at(
                    meta, np.array([centred_x]), np.array([centred_y])
                )
                global_index = channel_for_wavelength(float(lam[0]))
                if global_index:
                    subchan = global_index - (detector - 1) * 17
            except Exception:  # noqa: BLE001 - no channel is better than a wrong one
                subchan = 0
    channel = (detector - 1) * 17 + subchan if 1 <= subchan <= 17 else None

    return {
        "flux": flux,
        "fluxErr": flux_error,
        "channel": channel,
        "subchan": subchan if 1 <= subchan <= 17 else None,
        "detector": detector,
        "mjd": float(meta.get("mjd") or 0.0),
        "exptime": float(meta.get("exptime") or 0.0),
        "npix": int(ap_values.size),
        "apertureArcsec": round(ap_radius * scale, 2),
        "annulusArcsec": [round(ann_inner * scale, 2), round(ann_outer * scale, 2)],
        "background": background,
        "backgroundScatter": scatter,
        "offsetArcsec": round(math.hypot(centred_x - cx, centred_y - cy) * scale, 2),
        "recentred": recentred,
        "flags": flags,
        "flagFraction": flag_fraction,
        "solidAngleSr": solid_angle,
    }


def _select_rows(rows: list[dict[str, str]], max_products: int) -> list[dict[str, str]]:
    """Pick visits that cover every detector band, evenly spread in time.

    A spectrum needs all six bands, so the budget is split per detector instead
    of taking a prefix of the SIA2 list (which is roughly time-ordered and would
    over-represent one part of the survey).
    """

    usable: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in rows:
        if (row.get("dataproduct_type") or "image") != "image":
            continue
        url = _s3_url(row.get("cloud_access"), row.get("access_url") or "")
        if not url or url in seen:
            continue
        seen.add(url)
        usable.append(row)

    by_detector: dict[int, list[dict[str, str]]] = {}
    for row in usable:
        detector = _detector_from_row(row) or 0
        by_detector.setdefault(detector, []).append(row)

    per_detector = max(1, max_products // max(1, len(by_detector)))
    selected: list[dict[str, str]] = []
    for detector in sorted(by_detector):
        group = by_detector[detector]
        if len(group) <= per_detector:
            selected.extend(group)
            continue
        step = len(group) / per_detector
        selected.extend(
            group[min(len(group) - 1, int(round(index * step)))]
            for index in range(per_detector)
        )
    return selected[:max_products]


def spectrum(
    ra: float,
    dec: float,
    fov: float,
    epoch: int = 0,
    *,
    field_ra: float | None = None,
    field_dec: float | None = None,
    max_products: int = DEFAULT_MAX_PRODUCTS,
    flags_requested: bool = False,
) -> dict[str, Any] | None:
    """Multi-visit spectrum of the source at (ra, dec).

    ``epoch``/``field_ra``/``field_dec`` are accepted for API compatibility but
    are not used: a spectrum is not an epoch product.
    """

    del epoch, field_ra, field_dec
    max_products = int(max(1, min(HARD_MAX_PRODUCTS, max_products)))

    radius = min(0.01, max(SEARCH_RADIUS_DEG, fov * 0.02))
    key = cache.key(
        "spectrum-v4",
        round(ra, 5),
        round(dec, 5),
        max_products,
        int(flags_requested),
    )
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    collection: str | None = None
    rows: list[dict[str, str]] = []
    for candidate in SIA_COLLECTIONS:
        try:
            rows = query_sia(ra, dec, radius, candidate, maxrec=4000)
        except Exception:  # noqa: BLE001 - upstream failure is a normal state
            continue
        if rows:
            collection = candidate
            break
    if not rows:
        return None

    selected = _select_rows(rows, max_products)
    measurements: list[dict[str, Any]] = []

    def measure(row: dict[str, str]) -> dict[str, Any] | None:
        url = _s3_url(row.get("cloud_access"), row.get("access_url") or "")
        if not url:
            return None
        detector = _detector_from_row(row)
        try:
            point = _photometry(url, ra, dec, flags_requested=flags_requested)
        except Exception:  # noqa: BLE001 - one bad product must not kill the spectrum
            return None
        if point is None:
            return None
        point["url"] = url
        point["obsId"] = row.get("obs_id") or row.get("obs_publisher_did") or "unknown"
        if detector and not point.get("detector"):
            point["detector"] = detector
        if not point.get("mjd"):
            point["mjd"] = _float(row.get("t_min")) or 0.0
        return point

    with ThreadPoolExecutor(max_workers=12) as pool:
        for point in pool.map(measure, selected):
            if point is not None:
                measurements.append(point)

    if not measurements:
        return None

    outside = [item for item in measurements if not item.get("channel")]
    measurements = [item for item in measurements if item.get("channel")]
    if not measurements:
        return None

    measurements.sort(key=lambda item: (item["channel"] or 999, item["mjd"]))
    channels = sorted({item["channel"] for item in measurements if item["channel"]})

    wavelength: list[float | None] = []
    bandwidth: list[float | None] = []
    for item in measurements:
        channel = item["channel"]
        row = _CHANNEL_BY_INDEX.get(channel) if channel else None
        wavelength.append(round(row[2], 4) if row else None)
        bandwidth.append(round(row[6], 4) if row else None)

    def column(name: str) -> list[Any]:
        return [item.get(name) for item in measurements]

    payload = {
        "ra": ra,
        "dec": dec,
        "unit": "uJy",
        "method": (
            "multi-visit aperture photometry: one spectral image per visit, "
            "2xFWHM aperture, local annulus background, VARIANCE-based errors"
        ),
        "apertureFwhm": APERTURE_FWHM,
        "collection": collection,
        "productsAvailable": len(rows),
        "productsUsed": len(measurements),
        "outsideChannels": len(outside),
        "visits": len({item["obsId"] for item in measurements}),
        "channelsCovered": len(channels),
        "channelRange": [channels[0], channels[-1]] if channels else None,
        "wavelength": wavelength,
        "bandwidth": bandwidth,
        "flux": [round(item["flux"], 4) if item["flux"] is not None else None for item in measurements],
        "fluxErr": [
            round(item["fluxErr"], 4) if item["fluxErr"] is not None else None
            for item in measurements
        ],
        "channel": column("channel"),
        "channelLabel": [_channel_label(item["channel"]) for item in measurements],
        "detector": column("detector"),
        "subchan": column("subchan"),
        "mjd": [round(item["mjd"], 5) for item in measurements],
        "obsId": column("obsId"),
        "npix": column("npix"),
        "exptime": column("exptime"),
        "flags": column("flags"),
        "offsetArcsec": column("offsetArcsec"),
        "recentred": column("recentred"),
        "flagFraction": [round(item["flagFraction"], 4) for item in measurements],
        "snr": [
            round(item["flux"] / item["fluxErr"], 3)
            if item["fluxErr"] and math.isfinite(item["fluxErr"]) and item["fluxErr"] > 0
            else None
            for item in measurements
        ],
        "apertureArcsec": round(
            float(np.median([item["apertureArcsec"] for item in measurements])), 2
        ),
        "channelTable": channel_rows(),
        "note": (
            "Each point is one real exposure measured at the wavelength of the "
            "channel that covers the target in that visit. A full 102-channel "
            "spectrum needs visits spanning every channel; the survey provides "
            "at least four per channel over the mission."
        ),
    }
    cache.put_json(key, payload, ttl=SPECTRUM_CACHE_TTL)
    return payload


def spectrum_visits(ra: float, dec: float, fov: float) -> list[dict[str, Any]]:
    """Diagnostic helper: list the visits covering a position (used by tests)."""

    rows: list[dict[str, str]] = []
    for candidate in SIA_COLLECTIONS:
        try:
            rows = query_sia(ra, dec, min(0.01, fov * 0.02), candidate, maxrec=4000)
        except Exception:  # noqa: BLE001
            continue
        if rows:
            break
    return [
        {"mjd": visit.mjd, "obsId": visit.obs_id, "detectors": sorted(visit.products)}
        for visit in build_visits(rows)
    ]
