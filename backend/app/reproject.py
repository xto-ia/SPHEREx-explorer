"""Reproject SPHEREx detector images onto a common tangent-plane grid.

Blinking and differencing real exposures only works if every epoch is sampled
on the same sky grid, so the server resamples each product with its own
SIP-aware WCS (astropy) before anything reaches the browser.
"""

from __future__ import annotations

import warnings

import numpy as np
from astropy.wcs import WCS

from .channels import channel_at_pixels
from .images import (
    product_meta,
    read_flags_window,
    read_variance_window,
    read_window,
    wavelength_at,
    wcs_for,
)

warnings.filterwarnings("ignore", category=Warning)


def output_wcs(ra: float, dec: float, fov: float, shape: int) -> WCS:
    scale = fov / shape
    wcs = WCS(naxis=2)
    wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    wcs.wcs.crval = [ra, dec]
    wcs.wcs.crpix = [(shape + 1) / 2, (shape + 1) / 2]
    # Row 0 of the sampled array is row 0 of the canvas (`putImageData`), so the
    # declination axis must decrease with the pixel index: cdelt[1] = -scale
    # puts North at the top and East at the left, matching `skyToPixel` and the
    # image worker's `skyFromPixel`.
    wcs.wcs.cdelt = [-scale, -scale]
    return wcs


def _bilinear(data: np.ndarray, u: np.ndarray, v: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    height, width = data.shape
    finite = np.isfinite(data)
    safe = np.where(finite, data, 0.0).astype(np.float64, copy=False)

    u = np.clip(u, 0, width - 1)
    v = np.clip(v, 0, height - 1)
    i0 = np.floor(u).astype(np.int32)
    j0 = np.floor(v).astype(np.int32)
    i1 = np.minimum(i0 + 1, width - 1)
    j1 = np.minimum(j0 + 1, height - 1)
    fu = u - i0
    fv = v - j0

    w00 = (1 - fu) * (1 - fv) * finite[j0, i0]
    w10 = fu * (1 - fv) * finite[j0, i1]
    w01 = (1 - fu) * fv * finite[j1, i0]
    w11 = fu * fv * finite[j1, i1]

    weighted = (
        safe[j0, i0] * w00 + safe[j0, i1] * w10 + safe[j1, i0] * w01 + safe[j1, i1] * w11
    )
    weight = w00 + w10 + w01 + w11
    with np.errstate(invalid="ignore", divide="ignore"):
        value = np.where(weight > 0, weighted / weight, np.nan)
    return value, weight > 0


def _nearest(data: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
    height, width = data.shape
    i = np.clip(np.rint(u).astype(np.int32), 0, width - 1)
    j = np.clip(np.rint(v).astype(np.int32), 0, height - 1)
    return data[j, i]


def sample_product(
    url: str,
    ra: float,
    dec: float,
    fov: float,
    shape: int,
    *,
    want_flags: bool = True,
    want_variance: bool = True,
    lambda_size: int = 96,
) -> dict[str, np.ndarray | None]:
    """Resample one detector product onto the output grid.

    Returns the calibrated image (MJy/sr) together with everything needed to
    describe it scientifically: the per-pixel channel index from the official
    calibration map, a coarse WAVE-TAB wavelength grid (one value per pixel of
    the coarse grid, bilinearly upsampled by the client), the per-pixel
    variance and the FLAGS bitmask.
    """

    meta = product_meta(url)
    in_wcs = wcs_for(url)
    out_wcs = output_wcs(ra, dec, fov, shape)

    yy, xx = np.mgrid[0:shape, 0:shape].astype(np.float64)
    sky_ra, sky_dec = out_wcs.all_pix2world(xx, yy, 0)
    try:
        px, py = in_wcs.all_world2pix(sky_ra, sky_dec, 0)
    except Exception:  # noqa: BLE001 - SIP inversion can fail far outside the footprint
        px = np.full_like(sky_ra, np.nan)
        py = np.full_like(sky_dec, np.nan)

    naxis1, naxis2 = meta["naxis1"], meta["naxis2"]
    inside = (
        np.isfinite(px)
        & np.isfinite(py)
        & (px > -1)
        & (py > -1)
        & (px < naxis1)
        & (py < naxis2)
    )
    if not inside.any():
        return {
            "image": np.full((shape, shape), np.nan, dtype=np.float32),
            "flags": np.zeros((shape, shape), dtype=np.uint32) if want_flags else None,
            "variance": np.full((shape, shape), np.nan, dtype=np.float32) if want_variance else None,
            "channel": np.zeros((shape, shape), dtype=np.uint8),
            "wavelength": np.full((lambda_size, lambda_size), np.nan, dtype=np.float32),
            "coverage": np.zeros((shape, shape), dtype=bool),
        }

    x0 = max(int(np.floor(np.nanmin(px[inside]))) - 2, 0)
    x1 = min(int(np.ceil(np.nanmax(px[inside]))) + 3, naxis1)
    y0 = max(int(np.floor(np.nanmin(py[inside]))) - 2, 0)
    y1 = min(int(np.ceil(np.nanmax(py[inside]))) + 3, naxis2)

    data = read_window(url, meta["datLoc"], naxis1, meta["bitpix"], y0, y1, x0, x1)
    image, weight = _bilinear(np.asarray(data, dtype=np.float64), px - x0, py - y0)
    coverage = weight & inside

    flags = None
    if want_flags:
        try:
            flag_window = read_flags_window(url, y0, y1, x0, x1)
            flags = _nearest(flag_window, px - x0, py - y0).astype(np.uint32)
            flags = np.where(coverage, flags, 0)
        except Exception:  # noqa: BLE001 - flags are optional metadata
            flags = np.zeros((shape, shape), dtype=np.uint32)

    variance = None
    if want_variance:
        try:
            variance_window = read_variance_window(url, y0, y1, x0, x1)
            if variance_window is not None:
                variance, _ = _bilinear(
                    np.asarray(variance_window, dtype=np.float64), px - x0, py - y0
                )
                variance = np.where(coverage, variance, np.nan).astype(np.float32)
        except Exception:  # noqa: BLE001 - variance is an enhancement
            variance = None

    image = np.where(coverage, image, np.nan).astype(np.float32)

    # Official per-pixel channel index (0-18); 0 means "outside the nominal
    # 17-channel layout", exactly as the calibration product defines it.
    channel = channel_at_pixels(px, py, (naxis2, naxis1))
    if channel is None:
        channel = np.zeros((shape, shape), dtype=np.uint8)
    else:
        channel = np.where(inside, channel, 0).astype(np.uint8)

    # WAVE-TAB wavelength on a coarse grid; the field is smooth (the LVF varies
    # by ~1e-4 um per pixel), so 96x96 plus bilinear upsampling is exact enough
    # for labels and probes while staying ~36 kB on the wire.
    step = max(1, shape // lambda_size)
    sampled = np.arange(0, shape, step)[:lambda_size]
    wavelength = np.full((len(sampled), len(sampled)), np.nan, dtype=np.float32)
    if "wave" in meta:
        try:
            lam, _bandwidth = wavelength_at(
                meta, px[np.ix_(sampled, sampled)], py[np.ix_(sampled, sampled)]
            )
            wavelength = np.where(
                np.isfinite(lam), lam, np.nan
            ).astype(np.float32)
        except Exception:  # noqa: BLE001 - wavelength is metadata, not pixels
            wavelength = np.full((len(sampled), len(sampled)), np.nan, dtype=np.float32)

    return {
        "image": image,
        "flags": flags,
        "variance": variance,
        "channel": channel,
        "wavelength": wavelength,
        "coverage": coverage,
    }

