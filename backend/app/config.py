"""Runtime configuration for the SPHEREx Explorer backend."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = Path(os.environ.get("SPHEREX_CACHE_DIR", BASE_DIR / "cache"))

# 5 GB disk cache, least-recently-used eviction.
CACHE_LIMIT_BYTES = int(os.environ.get("SPHEREX_CACHE_BYTES", 5 * 1024**3))

SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
SIA_COLLECTIONS = ("spherex_dr1", "spherex_qr3", "spherex_qr3_deep", "spherex_dr1_deep")
GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
IRSA_TAP_URL = "https://irsa.ipac.caltech.edu/TAP/sync"
# CADC's TAP service lives at /argus since the 2024 migration and emits VOTable
# only (FORMAT=json is rejected with "unknown format: json").
CADC_TAP_URL = "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus/sync"

FRAME_SIZE = 480
MAX_FOV = 5.0
MIN_FOV = 0.05

SIA_CACHE_TTL = 60 * 60  # 1 hour
OVERLAY_CACHE_TTL = 6 * 60 * 60
FLAGS_CACHE_TTL = 30 * 24 * 60 * 60

UPSTREAM_CONCURRENCY = int(os.environ.get("SPHEREX_UPSTREAM_CONCURRENCY", 4))
UPSTREAM_TIMEOUT = float(os.environ.get("SPHEREX_UPSTREAM_TIMEOUT", 120))

CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "SPHEREX_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,"
        "http://127.0.0.1:4173,http://localhost:4183,http://127.0.0.1:4183",
    ).split(",")
    if origin.strip()
]

# Dev servers move to the next free port when 5173 is busy, so any loopback
# origin is accepted in addition to the explicit list above.
CORS_ORIGIN_REGEX = os.environ.get(
    "SPHEREX_CORS_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
)

# SPHEREx detector arrays: 6 arrays x 17 channels = 102 spectral channels.
ARRAY_RANGES_UM = (
    (0.75, 1.11),
    (1.11, 1.64),
    (1.64, 2.42),
    (2.42, 3.58),
    (3.58, 4.29),
    (4.29, 5.00),
)

# 102 channel edges: 17 per array, chained without gaps.
_edges: list[float] = []
for _low, _high in ARRAY_RANGES_UM:
    _step = (_high - _low) / 17
    _edges.extend(_low + _step * index for index in range(17))
_edges.append(ARRAY_RANGES_UM[-1][1])
CHANNEL_EDGES_UM = tuple(_edges)
