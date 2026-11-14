"""Frame service: resampled detector cutouts, cached on disk."""

from __future__ import annotations

import warnings
from typing import Any

import numpy as np

from .cache import cache
from .config import FRAME_SIZE
from .images import pixel_scale_arcsec
from .reproject import sample_product
from .sia import product_for

LAMBDA_SIZE = 96


def _native_shape(fov: float, scale_arcsec: float) -> int:
    """Output grid that keeps the detector's own 6.15" sampling (no oversampling)."""

    if scale_arcsec <= 0:
        return FRAME_SIZE
    return int(max(64, min(1024, round(fov * 3600.0 / scale_arcsec))))


def frame(
    ra: float,
    dec: float,
    fov: float,
    epoch: int,
    detector: int,
    shape: int = FRAME_SIZE,
    *,
    want_flags: bool = False,
    want_variance: bool = True,
) -> dict[str, Any] | None:
    """Resampled MJy/sr frame for one (epoch, detector).

    The returned dict carries the calibrated plane plus the scientific context:
    the official channel index per pixel, the WAVE-TAB wavelength grid, the
    variance plane and the detector's native pixel scale.
    """

    product = product_for(ra, dec, fov, epoch, detector)
    if product is None:
        return None

    key = cache.key(
        "frame-v3",
        round(ra, 4),
        round(dec, 4),
        round(fov, 3),
        epoch,
        detector,
        shape,
        int(want_flags),
        int(want_variance),
    )
    cached = cache.get_npz(key)
    if cached is not None:
        return {
            "image": cached["image"],
            "flags": cached.get("flags"),
            "variance": cached.get("variance"),
            "channel": cached.get("channel"),
            "wavelength": cached.get("wavelength"),
            "coverage": cached["coverage"],
            "mjd": float(cached["mjd"][0]) if "mjd" in cached else product.mjd,
            "url": product.url,
            "obsId": product.obs_id,
            "pixelScaleArcsec": float(cached["pixelScale"][0]) if "pixelScale" in cached else 6.15,
            "fromCache": True,
        }

    result = sample_product(
        product.url,
        ra,
        dec,
        fov,
        shape,
        want_flags=want_flags,
        want_variance=want_variance,
        lambda_size=LAMBDA_SIZE,
    )
    scale = pixel_scale_arcsec(product.url)

    payload: dict[str, np.ndarray] = {
        "image": np.asarray(result["image"], dtype=np.float32),
        "coverage": np.asarray(result["coverage"]).astype(np.uint8),
        "channel": np.asarray(result["channel"], dtype=np.uint8),
        "wavelength": np.asarray(result["wavelength"], dtype=np.float32),
        "mjd": np.array([product.mjd], dtype=np.float64),
        "pixelScale": np.array([scale], dtype=np.float64),
    }
    if result["flags"] is not None and want_flags:
        payload["flags"] = np.asarray(result["flags"], dtype=np.uint32)
    if result["variance"] is not None and want_variance:
        payload["variance"] = np.asarray(result["variance"], dtype=np.float32)
    cache.put_npz(key, payload)

    return {
        "image": payload["image"],
        "flags": result["flags"] if want_flags else None,
        "variance": result["variance"] if want_variance else None,
        "channel": payload["channel"],
        "wavelength": payload["wavelength"],
        "coverage": result["coverage"],
        "mjd": product.mjd,
        "url": product.url,
        "obsId": product.obs_id,
        "pixelScaleArcsec": scale,
        "fromCache": False,
    }


def stack(
    ra: float,
    dec: float,
    fov: float,
    epoch: int,
    shape: int = FRAME_SIZE,
    *,
    want_flags: bool = False,
) -> dict[str, Any] | None:
    """Quick look: mean of every available detector of one epoch.

    This is deliberately *not* a science product. Each detector covers a
    different wavelength range and, inside a spectral image, a different
    wavelength per row, so the mean mixes wavelengths. The API flags the result
    as a quick look and the UI never presents it as a measurement.
    """

    images: list[np.ndarray] = []
    variances: list[np.ndarray] = []
    coverage = None
    flags = None
    mjds: list[float] = []
    obs_ids: list[str] = []
    scale = 6.15
    for detector in range(1, 7):
        result = frame(
            ra,
            dec,
            fov,
            epoch,
            detector,
            shape,
            want_flags=want_flags,
            want_variance=True,
        )
        if result is None:
            continue
        images.append(result["image"])
        if result["variance"] is not None:
            variances.append(result["variance"])
        coverage = result["coverage"] if coverage is None else coverage | result["coverage"]
        if result["flags"] is not None:
            # A detector only covers part of the shared grid; do not OR the
            # "outside footprint" quality bits of missing pixels into the stack.
            contribution = result["flags"]
            if result["coverage"] is not None:
                contribution = np.where(result["coverage"] > 0, contribution, 0)
            flags = contribution if flags is None else (flags | contribution)
        if result["mjd"] is not None:
            mjds.append(float(result["mjd"]))
        if result["obsId"]:
            obs_ids.append(str(result["obsId"]))
        scale = float(result.get("pixelScaleArcsec") or scale)

    if not images:
        return None

    with warnings.catch_warnings():
        # A detector footprint that misses part of the grid leaves NaN columns;
        # averaging them is expected and must not spam the server log.
        warnings.simplefilter("ignore", RuntimeWarning)
        stacked = np.nanmean(np.stack(images), axis=0).astype(np.float32)
        if variances:
            variance = np.nanmean(np.stack(variances), axis=0).astype(np.float32)
        else:
            variance = None

    return {
        "image": stacked,
        "flags": flags,
        "variance": variance,
        "channel": None,
        "wavelength": None,
        "coverage": coverage,
        "mjd": float(np.mean(mjds)) if mjds else None,
        "url": None,
        "obsId": obs_ids[0] if obs_ids else None,
        "pixelScaleArcsec": scale,
        "fromCache": False,
    }


def available_detectors(ra: float, dec: float, fov: float, epoch: int) -> list[int]:
    from .sia import coverage as coverage_report  # local import avoids a cycle

    data = coverage_report(ra, dec, fov)
    if not data["covered"] or epoch >= len(data["epochs"]):
        return []
    return sorted(int(key) for key in data["epochs"][epoch]["detectors"])
