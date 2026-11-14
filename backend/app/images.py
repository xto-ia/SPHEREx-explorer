"""Read SPHEREx Level-2 planes over HTTP Range requests.

Only the rows that a cutout needs are downloaded: a 0.5 deg window is ~2 MB
instead of the 62 MB product, and every result is cached on disk.
"""

from __future__ import annotations

import json
import math
from typing import Any

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS

from .cache import cache
from .config import FLAGS_CACHE_TTL
from .fits_io import HttpRangeFile, open_fits
from .http import client

DTYPES = {-32: ">f4", -64: ">f8", 16: ">i2", 32: ">i4", 8: "u1"}


def product_meta(url: str) -> dict[str, Any]:
    """Header metadata for one product (cached; products are immutable)."""

    key = cache.key("meta-v1", url)
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    with open_fits(url, client=client) as (hdul, _remote):
        image = hdul["IMAGE"]
        header = image.header
        info = image.fileinfo()
        meta: dict[str, Any] = {
            "url": url,
            "datLoc": int(info["datLoc"]),
            "datSpan": int(info["datSpan"]),
            "naxis1": int(header["NAXIS1"]),
            "naxis2": int(header["NAXIS2"]),
            "bitpix": int(header["BITPIX"]),
            "bunit": header.get("BUNIT"),
            "mjd": float(header.get("MJD-OBS") or 0.0),
            "exptime": float(header.get("EXPTIME") or 0.0),
            "detector": int(header.get("DETECTOR") or 0),
            "header": {card[0]: card[1] for card in header.cards if card[0] not in ("COMMENT", "HISTORY", "")},
        }
        if "VARIANCE" in [h.name for h in hdul]:
            variance = hdul["VARIANCE"]
            meta["varianceDatLoc"] = int(variance.fileinfo()["datLoc"])
        if "WCS-WAVE" in [h.name for h in hdul]:
            wave = hdul["WCS-WAVE"]
            data = wave.data
            meta["wave"] = {
                "x": np.asarray(data["X"][0], dtype=float).tolist(),
                "y": np.asarray(data["Y"][0], dtype=float).tolist(),
                "values": np.asarray(data["VALUES"][0], dtype=float).tolist(),
            }
        if "EPSF" in [h.name for h in hdul]:
            meta["hasEpsf"] = True

    cache.put_json(key, meta, ttl=30 * 24 * 60 * 60)
    return meta


def read_window(
    url: str,
    dat_loc: int,
    naxis1: int,
    bitpix: int,
    y0: int,
    y1: int,
    x0: int,
    x1: int,
) -> np.ndarray:
    """Read rows [y0, y1) and columns [x0, x1) with one Range request."""

    item = np.dtype(DTYPES[bitpix]).itemsize
    row_bytes = naxis1 * item
    start = dat_loc + y0 * row_bytes
    end = dat_loc + y1 * row_bytes - 1
    response = client.get(url, headers={"Range": f"bytes={start}-{end}"})
    if response.status_code not in (200, 206):
        response.raise_for_status()
    rows = np.frombuffer(response.content, dtype=DTYPES[bitpix]).reshape(y1 - y0, naxis1)
    return rows[:, x0:x1]


def read_flags_window(url: str, y0: int, y1: int, x0: int, x1: int) -> np.ndarray:
    """Decode a window of the compressed FLAGS bitmask (cached per window)."""

    key = cache.key("flags", url, y0, y1, x0, x1)
    cached = cache.get_npz(key)
    if cached is not None and "flags" in cached:
        return cached["flags"]

    with open_fits(url, client=client) as (hdul, _remote):
        window = np.asarray(hdul["FLAGS"].section[y0:y1, x0:x1], dtype=np.uint32)

    cache.put_npz(key, {"flags": window}, ttl=FLAGS_CACHE_TTL)
    return window


def read_variance_window(url: str, y0: int, y1: int, x0: int, x1: int) -> np.ndarray | None:
    """Read a window of the VARIANCE plane (MJy^2/sr^2), cached per window."""

    meta = product_meta(url)
    if "varianceDatLoc" not in meta:
        return None

    key = cache.key("variance", url, y0, y1, x0, x1)
    cached = cache.get_npz(key)
    if cached is not None and "variance" in cached:
        return cached["variance"]

    window = read_window(
        url, meta["varianceDatLoc"], meta["naxis1"], meta["bitpix"], y0, y1, x0, x1
    ).astype(np.float32)
    cache.put_npz(key, {"variance": window}, ttl=FLAGS_CACHE_TTL)
    return window


def pixel_scale_arcsec(url: str) -> float:
    """Nominal detector pixel scale in arcseconds (cached)."""

    key = cache.key("pixel-scale", url)
    cached = cache.get_json(key)
    if cached is not None:
        return float(cached["arcsec"])
    wcs = wcs_for(url)
    try:
        area = float(wcs.proj_plane_pixel_area())
        scale = float(np.sqrt(area) * 3600.0)
    except Exception:  # noqa: BLE001 - nominal SPHEREx sampling
        scale = 6.15
    cache.put_json(key, {"arcsec": scale}, ttl=30 * 24 * 60 * 60)
    return scale


def pixel_solid_angle(url: str, x: float, y: float) -> float:
    """Solid angle of one detector pixel at (x, y) in steradians.

    SPHEREx ships a dedicated solid-angle map, but the local WCS Jacobian is
    accurate to well under a percent and needs no extra download. Used to turn
    surface brightness (MJy/sr) into a flux density (uJy).
    """

    key = cache.key("pixel-area", url, round(x, 2), round(y, 2))
    cached = cache.get_json(key)
    if cached is not None:
        return float(cached["sr"])

    wcs = wcs_for(url)
    corners = wcs.all_pix2world(
        np.array([[x - 0.5, y - 0.5], [x + 0.5, y - 0.5], [x + 0.5, y + 0.5], [x - 0.5, y + 0.5]]),
        0,
    )
    ra = np.asarray(corners[:, 0], dtype=float)
    dec = np.asarray(corners[:, 1], dtype=float)
    # Shoelace area of the pixel quad in the local tangent plane. For a 6"
    # pixel the spherical correction is ~1e-8 relative, far below the
    # calibration error of the flux conversion itself.
    cos_dec = math.cos(math.radians(float(dec.mean())))
    dx = (ra - ra[0]) * cos_dec
    dy = dec - dec[0]
    area_deg2 = 0.5 * abs(
        np.dot(dx, np.roll(dy, -1)) - np.dot(dy, np.roll(dx, -1))
    )
    sr = float(area_deg2 * (math.pi / 180.0) ** 2)
    if not np.isfinite(sr) or sr <= 0:
        try:
            sr = float(wcs.proj_plane_pixel_area()) * (np.pi / 180.0) ** 2
        except Exception:  # noqa: BLE001 - fall back to the nominal 6.15" pixel
            sr = (6.15 / 206265.0) ** 2
    cache.put_json(key, {"sr": sr}, ttl=30 * 24 * 60 * 60)
    return sr



def wcs_for(url: str) -> WCS:
    meta = product_meta(url)
    header = fits.Header()
    for keyword, value in meta["header"].items():
        try:
            header[keyword] = value
        except (ValueError, TypeError):
            continue
    return WCS(header)


def wavelength_at(meta: dict[str, Any], x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Bilinear WAVE-TAB interpolation: (wavelength, bandwidth) in microns.

    The table in the product is indexed in FITS 1-based pixel coordinates with
    X along NAXIS1 and Y along NAXIS2.
    """

    wave = meta["wave"]
    xq = np.asarray(x, dtype=float) + 1.0
    yq = np.asarray(y, dtype=float) + 1.0
    grid_x = np.asarray(wave["x"], dtype=float)
    grid_y = np.asarray(wave["y"], dtype=float)
    values = np.asarray(wave["values"], dtype=float)  # (ny, nx, 2)

    ix = np.clip(np.searchsorted(grid_x, xq) - 1, 0, len(grid_x) - 2)
    iy = np.clip(np.searchsorted(grid_y, yq) - 1, 0, len(grid_y) - 2)
    fx = np.clip((xq - grid_x[ix]) / np.maximum(grid_x[ix + 1] - grid_x[ix], 1e-9), 0.0, 1.0)
    fy = np.clip((yq - grid_y[iy]) / np.maximum(grid_y[iy + 1] - grid_y[iy], 1e-9), 0.0, 1.0)

    v00 = values[iy, ix]
    v10 = values[iy, ix + 1]
    v01 = values[iy + 1, ix]
    v11 = values[iy + 1, ix + 1]
    value = (
        v00 * ((1 - fx) * (1 - fy))[..., None]
        + v10 * (fx * (1 - fy))[..., None]
        + v01 * ((1 - fx) * fy)[..., None]
        + v11 * (fx * fy)[..., None]
    )
    return value[..., 0], value[..., 1]
