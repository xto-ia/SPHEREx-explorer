"""Official SPHEREx spectral channel calibration.

The mission defines the 102 channels geometrically: 17 per detector band, with
logarithmically spaced boundaries. The ``spectral_channels`` calibration
product published by IRSA ships both the authoritative per-channel table and a
2040x2040 map that assigns every detector pixel to a channel index (0-18).
That map is what the mission itself uses to build channel mosaics, and it
already encodes the curvature of the LVF passbands, so the Explorer uses it
instead of slicing an image by a straight wavelength threshold.

The file is ~4 MB and immutable; it is downloaded once and kept next to the
disk cache.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

import numpy as np

from .channels_data import CHANNELS
from .config import CACHE_DIR
from .http import client

CHANNEL_MAP_URL = (
    "https://nasa-irsa-spherex.s3.us-east-1.amazonaws.com/qr3/spectral_channels/"
    "cal-sch-v2-2026-229/spectral_channels_spx_cal-sch-v2-2026-229.fits"
)
CHANNEL_MAP_PATH = Path(CACHE_DIR) / "reference" / "spectral_channels_spx_cal-sch-v2-2026-229.fits"

_lock = threading.Lock()
_map: np.ndarray | None = None
_loaded = False


def _download() -> Path | None:
    """Fetch the calibration file once; return None when the archive is down."""

    CHANNEL_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    if CHANNEL_MAP_PATH.exists() and CHANNEL_MAP_PATH.stat().st_size > 1_000_000:
        return CHANNEL_MAP_PATH
    try:
        response = client.get(CHANNEL_MAP_URL, timeout=120)
        response.raise_for_status()
    except Exception:  # noqa: BLE001 - the map is an enhancement, not a dependency
        return None
    if len(response.content) < 1_000_000:
        return None
    temporary = CHANNEL_MAP_PATH.with_suffix(".part")
    temporary.write_bytes(response.content)
    temporary.replace(CHANNEL_MAP_PATH)
    return CHANNEL_MAP_PATH


def channel_map() -> np.ndarray | None:
    """Per-pixel channel index (0-18) for a 2040x2040 detector array."""

    global _map, _loaded
    if _loaded:
        return _map
    with _lock:
        if _loaded:
            return _map
        path = _download()
        _map = None
        if path is not None:
            try:
                from astropy.io import fits

                with fits.open(path, memmap=True) as hdul:
                    _map = np.asarray(hdul["CHANNEL_MAP"].data, dtype=np.uint8)
            except Exception:  # noqa: BLE001 - corrupted download must not break frames
                _map = None
        _loaded = True
    return _map


def channel_rows() -> list[dict[str, Any]]:
    """The 102-channel table as served to the browser."""

    rows: list[dict[str, Any]] = []
    for index, (detector, subchan, wavelength, low, high, resolution, bandwidth) in enumerate(
        CHANNELS, start=1
    ):
        rows.append(
            {
                "index": index,
                "detector": detector,
                "subchan": subchan,
                "label": f"D{detector}-{subchan:02d}",
                "wavelength": wavelength,
                "wlMin": low,
                "wlMax": high,
                "R": resolution,
                "bandwidth": bandwidth,
            }
        )
    return rows


def band_rows() -> list[dict[str, Any]]:
    """Per-detector coverage, derived from the channel edges."""

    from .channels_data import BAND_RANGES_UM

    return [
        {
            "index": index + 1,
            "label": f"D{index + 1}",
            "low": low,
            "high": high,
            "channels": [
                row for row in channel_rows() if row["detector"] == index + 1
            ],
        }
        for index, (low, high) in enumerate(BAND_RANGES_UM)
    ]


def channel_at_pixels(px: np.ndarray, py: np.ndarray, shape: tuple[int, int]) -> np.ndarray | None:
    """Nearest-neighbour channel index for detector pixel coordinates (0-based)."""

    grid = channel_map()
    if grid is None:
        return None
    height, width = shape
    x = np.clip(np.rint(px).astype(np.int32), 0, width - 1)
    y = np.clip(np.rint(py).astype(np.int32), 0, height - 1)
    return grid[y, x]


def channel_for_wavelength(wavelength: float) -> int | None:
    """Fallback channel lookup when the official map is unavailable."""

    from .config import CHANNEL_EDGES_UM

    edges = CHANNEL_EDGES_UM
    if not np.isfinite(wavelength) or wavelength < edges[0] or wavelength > edges[-1]:
        return None
    index = int(np.searchsorted(edges, wavelength, side="right")) - 1
    return max(1, min(len(CHANNELS), index + 1))
