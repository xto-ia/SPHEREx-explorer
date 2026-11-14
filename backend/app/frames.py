"""Frame service: resampled detector cutouts, cached on disk."""

from __future__ import annotations

import warnings
from typing import Any

import numpy as np

from .cache import cache
from .config import FRAME_SIZE
from .reproject import sample_product
from .sia import product_for


def frame(
    ra: float,
    dec: float,
    fov: float,
    epoch: int,
    detector: int,
    shape: int = FRAME_SIZE,
    *,
    want_flags: bool = False,
) -> dict[str, Any] | None:
    """Resampled MJy/sr frame for one (epoch, detector)."""

    product = product_for(ra, dec, fov, epoch, detector)
    if product is None:
        return None

    key = cache.key(
        "frame-v2",
        round(ra, 4),
        round(dec, 4),
        round(fov, 3),
        epoch,
        detector,
        shape,
        int(want_flags),
    )
    cached = cache.get_npz(key)
    if cached is not None:
        return {
            "image": cached["image"],
            "flags": cached.get("flags"),
            "coverage": cached["coverage"],
            "mjd": float(cached["mjd"][0]) if "mjd" in cached else product.mjd,
            "url": product.url,
            "obsId": product.obs_id,
            "fromCache": True,
        }

    image, flags, coverage = sample_product(
        product.url, ra, dec, fov, shape, want_flags=want_flags
    )
    payload: dict[str, np.ndarray] = {
        "image": image,
        "coverage": coverage.astype(np.uint8),
        "mjd": np.array([product.mjd], dtype=np.float64),
    }
    if flags is not None and want_flags:
        payload["flags"] = flags.astype(np.uint32)
    cache.put_npz(key, payload)

    return {
        "image": image,
        "flags": flags if want_flags else None,
        "coverage": coverage,
        "mjd": product.mjd,
        "url": product.url,
        "obsId": product.obs_id,
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
    """Mean of every available detector of one epoch (102-band stack)."""

    images: list[np.ndarray] = []
    coverage = None
    flags = None
    mjds: list[float] = []
    obs_ids: list[str] = []
    for detector in range(1, 7):
        result = frame(ra, dec, fov, epoch, detector, shape, want_flags=want_flags)
        if result is None:
            continue
        images.append(result["image"])
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

    if not images:
        return None

    with warnings.catch_warnings():
        # A detector footprint that misses part of the grid leaves NaN columns;
        # averaging them is expected and must not spam the server log.
        warnings.simplefilter("ignore", RuntimeWarning)
        stacked = np.nanmean(np.stack(images), axis=0).astype(np.float32)

    return {
        "image": stacked,
        "flags": flags,
        "coverage": coverage,
        "mjd": float(np.mean(mjds)) if mjds else None,
        "url": None,
        "obsId": obs_ids[0] if obs_ids else None,
        "fromCache": False,
    }


def available_detectors(ra: float, dec: float, fov: float, epoch: int) -> list[int]:
    from .sia import coverage as coverage_report  # local import avoids a cycle

    data = coverage_report(ra, dec, fov)
    if not data["covered"] or epoch >= len(data["epochs"]):
        return []
    return sorted(int(key) for key in data["epochs"][epoch]["detectors"])
