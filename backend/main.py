"""SPHEREx Explorer API.

Serves real archive data: SIA2 discovery, resampled detector cutouts, 102-channel
spectra from the WAVE-TAB tables, and catalogue overlays. Heavy FITS work stays
here; the browser keeps only the interactive image math.
"""

from __future__ import annotations

import json
import random
import struct
import time
from typing import Annotated

import numpy as np
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.cache import cache
from app.channels import band_rows, channel_rows
from app.config import CORS_ORIGINS, CORS_ORIGIN_REGEX, FRAME_SIZE, MAX_FOV, MIN_FOV, source_stamp
from app.frames import LAMBDA_SIZE, available_detectors, frame, stack
from app.overlays import overlays
from app.sia import coverage, remembered_fields
from app.spectrum import spectrum

FRAME_MAGIC = b"SPXF"

# Evaluated once, when this process starts: a running API keeps the stamp of the
# code it actually loaded, so the launcher can tell it apart from a newer source.
SOURCE_STAMP = source_stamp()

app = FastAPI(title="SPHEREx Explorer API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_origin_regex=None if CORS_ORIGINS == ["*"] else CORS_ORIGIN_REGEX,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _clamp_fov(fov: float) -> float:
    return max(MIN_FOV, min(MAX_FOV, fov))


def _ms_since(started: float) -> float:
    """Milliseconds elapsed since ``started`` (a ``perf_counter`` value)."""

    return (time.perf_counter() - started) * 1000.0


def _pack(header: dict, planes: list[tuple[str, np.ndarray]]) -> Response:
    payload = json.dumps(header).encode("utf-8")
    # Keep every plane 4-byte aligned so the browser can view it directly.
    payload += b" " * ((-len(payload)) % 4)
    body = bytearray(FRAME_MAGIC)
    body += struct.pack("<I", len(payload))
    body += payload
    for dtype, array in planes:
        body += np.ascontiguousarray(array, dtype=dtype).tobytes()
    return Response(content=bytes(body), media_type="application/octet-stream")


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "spherex-explorer-api",
        "version": app.version,
        # Lets start-local.cmd tell a current API from a leftover process.
        "sourceStamp": SOURCE_STAMP,
        "cache": cache.stats(),
    }


@app.get("/api/coverage")
def api_coverage(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
) -> Response:
    fov = _clamp_fov(fov)
    started = time.perf_counter()
    data = coverage(ra, dec, fov)
    data["frameSize"] = FRAME_SIZE
    data["requests"] = [
        {"epoch": epoch["index"], "detectors": sorted(int(key) for key in epoch["detectors"])}
        for epoch in data["epochs"]
    ]
    timings = f"coverage;dur={_ms_since(started):.1f}"
    if data.get("archiveError"):
        timings += ", archive;desc=unreachable"
    # Additive diagnostics only: the JSON body is unchanged, so the UI keeps
    # working while the browser devtools show where the seconds went.
    return JSONResponse(content=data, headers={"Server-Timing": timings})


@app.get("/api/frame")
def api_frame(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
    epoch: Annotated[int, Query(ge=0)] = 0,
    detector: Annotated[int, Query(ge=0, le=6)] = 3,
    shape: Annotated[int, Query(ge=64, le=1024)] = FRAME_SIZE,
    flags: Annotated[int, Query(ge=0, le=1)] = 0,
    variance: Annotated[int, Query(ge=0, le=1)] = 1,
) -> Response:
    fov = _clamp_fov(fov)
    started = time.perf_counter()
    result = (
        stack(ra, dec, fov, epoch, shape, want_flags=bool(flags))
        if detector == 0
        else frame(
            ra,
            dec,
            fov,
            epoch,
            detector,
            shape,
            want_flags=bool(flags),
            want_variance=bool(variance),
        )
    )
    if result is None:
        raise HTTPException(status_code=404, detail="no product covers this field/epoch/detector")

    channel = result.get("channel")
    wavelength = result.get("wavelength")
    variance_plane = result.get("variance")
    has_channel = channel is not None
    scale = float(result.get("pixelScaleArcsec") or 6.15)
    native_shape = int(max(64, min(1024, round(fov * 3600.0 / scale))))
    channel_rows_for_detector = [
        row for row in channel_rows() if row["detector"] == detector
    ] if detector > 0 else []

    # The quick look has no single channel and no single wavelength: send empty
    # planes of the right shape so the payload stays well formed and the UI can
    # see `hasChannel=false`.
    if channel is None:
        channel = np.zeros((shape, shape), dtype=np.uint8)
    if wavelength is None:
        wavelength = np.full((LAMBDA_SIZE, LAMBDA_SIZE), np.nan, dtype=np.float32)
    channel_plane = (
        np.asarray(channel, dtype=np.uint8)
        if channel is not None
        else np.zeros((shape, shape), dtype=np.uint8)
    )
    wavelength_plane = (
        np.asarray(wavelength, dtype=np.float32)
        if wavelength is not None
        else np.zeros((0,), dtype=np.float32)
    )

    header = {
        "ra": ra,
        "dec": dec,
        "fov": fov,
        "shape": shape,
        "epoch": epoch,
        "detector": detector,
        "mjd": result["mjd"],
        "obsId": result["obsId"],
        "unit": "MJy/sr",
        "hasFlags": result["flags"] is not None,
        "hasVariance": variance_plane is not None,
        "hasChannel": has_channel,
        "lambdaShape": int(wavelength_plane.shape[0]),
        "pixelScaleArcsec": scale,
        "nativeShape": native_shape,
        "channels": channel_rows_for_detector,
        "quickLook": detector == 0,
        "fromCache": result["fromCache"],
    }
    planes: list[tuple[str, np.ndarray]] = [
        ("<f4", np.asarray(result["image"], dtype=np.float32)),
        ("<u1", np.asarray(result["coverage"], dtype=np.uint8)),
        ("<u1", np.asarray(channel_plane, dtype=np.uint8)),
        ("<f4", np.asarray(wavelength_plane, dtype=np.float32)),
    ]
    if variance_plane is not None:
        planes.append(("<f4", np.asarray(variance_plane, dtype=np.float32)))
    if result["flags"] is not None:
        planes.append(("<u4", np.asarray(result["flags"], dtype=np.uint32)))
    response = _pack(header, planes)
    response.headers["Server-Timing"] = (
        f"frame;dur={_ms_since(started):.1f}, "
        f"cache;desc={'hit' if result['fromCache'] else 'miss'}"
    )
    return response


@app.get("/api/bands")
def api_bands() -> dict:
    """Official 102-channel definition (centres, edges, R, bandwidth)."""

    return {
        "channels": channel_rows(),
        "bands": [
            {
                "index": band["index"],
                "label": band["label"],
                "low": band["low"],
                "high": band["high"],
            }
            for band in band_rows()
        ],
        "source": "IRSA spectral_channels_spx_cal-sch-v2-2026-229",
        "note": (
            "Channels are the mission's geometric definition: 17 per detector "
            "band, logarithmically spaced. They are a survey-planning "
            "coordinate, not a per-pixel calibrated wavelength."
        ),
    }


@app.get("/api/epochs")
def api_epochs(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
    detector: Annotated[int, Query(ge=1, le=6)] = 3,
) -> dict:
    fov = _clamp_fov(fov)
    data = coverage(ra, dec, fov)
    epochs = [
        epoch
        for epoch in data["epochs"]
        if str(detector) in epoch["detectors"]
    ]
    return {
        "covered": bool(epochs),
        "collection": data["collection"],
        "detector": detector,
        "epochs": [
            {
                "index": epoch["index"],
                "mjd": epoch["mjd"],
                "obsId": epoch["obsId"],
                "detectors": sorted(int(key) for key in epoch["detectors"]),
            }
            for epoch in epochs
        ],
    }


@app.get("/api/spectrum")
def api_spectrum(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
    epoch: Annotated[int, Query(ge=0)] = 0,
    field_ra: Annotated[float | None, Query(ge=0, lt=360)] = None,
    field_dec: Annotated[float | None, Query(ge=-90, le=90)] = None,
    max_products: Annotated[int, Query(ge=1, le=900)] = 96,
    flags: Annotated[int, Query(ge=0, le=1)] = 0,
) -> dict:
    data = spectrum(
        ra,
        dec,
        _clamp_fov(fov),
        epoch,
        field_ra=field_ra,
        field_dec=field_dec,
        max_products=max_products,
        flags_requested=bool(flags),
    )
    if data is None:
        raise HTTPException(status_code=404, detail="no SPHEREx visit covers this position")
    return data


@app.get("/api/overlays")
def api_overlays(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
    layers: Annotated[str, Query(description="comma list: gaia, wise, neossat")] = "",
) -> dict:
    requested = tuple(layer.strip() for layer in layers.split(",") if layer.strip())
    result = overlays(ra, dec, _clamp_fov(fov), layers=requested or None)
    result["counts"] = {name: len(result[name]) for name in ("gaia", "wise", "neossat") if name in result}
    return result


@app.get("/api/random-field")
def api_random_field(fov: Annotated[float, Query(gt=0)] = 0.5) -> dict:
    """Random point that is guaranteed to have real SPHEREx coverage."""

    fov = _clamp_fov(fov)
    started = time.time()
    attempts = 0

    # 1) A handful of genuinely fresh draws (SIA2 is only partial-sky).
    while attempts < 6 and time.time() - started < 12:
        attempts += 1
        ra = round(random.random() * 360, 4)
        dec = round((np.arcsin(2 * random.random() - 1) * 180 / np.pi), 4)
        try:
            data = coverage(ra, dec, fov)
        except Exception:  # noqa: BLE001
            continue
        if data["covered"]:
            return {
                "ra": ra,
                "dec": dec,
                "fov": fov,
                "attempts": attempts,
                "collection": data["collection"],
                "epochs": len(data["epochs"]),
                "source": "draw",
            }

    # 2) Fall back to fields the explorer has already proven to be covered.
    known = remembered_fields()
    random.shuffle(known)
    for item in known[:4]:
        ra = round((item["ra"] + random.uniform(-0.2, 0.2)) % 360, 4)
        dec = round(item["dec"] + random.uniform(-0.2, 0.2), 4)
        if abs(dec) > 89:
            continue
        try:
            data = coverage(ra, dec, fov)
        except Exception:  # noqa: BLE001
            continue
        if data["covered"]:
            return {
                "ra": ra,
                "dec": dec,
                "fov": fov,
                "attempts": attempts + 1,
                "collection": data["collection"],
                "epochs": len(data["epochs"]),
                "source": "index",
            }

    raise HTTPException(status_code=404, detail="no covered field found in this attempt budget")


@app.get("/api/detectors")
def api_detectors(
    ra: Annotated[float, Query(ge=0, lt=360)],
    dec: Annotated[float, Query(ge=-90, le=90)],
    fov: Annotated[float, Query(gt=0)] = 0.5,
    epoch: Annotated[int, Query(ge=0)] = 0,
) -> dict:
    return {"epoch": epoch, "detectors": available_detectors(ra, dec, _clamp_fov(fov), epoch)}


