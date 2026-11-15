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

# IRSA products are immutable once published, and a 1-hour TTL meant every
# revisit after a coffee break paid the full SIA discovery round trip (measured
# at ~21 s per query on a normal connection). A day keeps the list fresh enough
# for a survey that is still growing without making the user wait for it.
SIA_CACHE_TTL = 24 * 60 * 60  # 24 hours
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
# Ranges and channel centres come from the official IRSA calibration product
# (spectral_channels_spx_cal-sch-v2), not from an even split of 0.75-5.0 um:
# bands 4-6 in particular are not evenly spaced.
from .channels_data import BAND_RANGES_UM, CHANNELS  # noqa: E402  (data module)

ARRAY_RANGES_UM = BAND_RANGES_UM

# Fallback channel edges used when the official channel map is unavailable.
# Each edge is the midpoint between two neighbouring channel passbands, so a
# pixel wavelength can be assigned to the channel it belongs to.
_edges: list[float] = [CHANNELS[0][3]]
for _index in range(1, len(CHANNELS)):
    _previous = CHANNELS[_index - 1]
    _current = CHANNELS[_index]
    _edges.append(round((_previous[4] + _current[3]) / 2.0, 5))
_edges.append(CHANNELS[-1][4])
CHANNEL_EDGES_UM = tuple(_edges)


def source_stamp() -> str:
    """Newest modification time of the backend sources, as a string.

    A local API is only reused when its stamp matches this value: a uvicorn
    left over from an earlier session would otherwise keep serving the old
    code no matter how often the launcher is restarted.
    """

    files = list(Path(__file__).resolve().parent.glob("*.py")) + [BASE_DIR / "main.py"]
    newest = max((path.stat().st_mtime for path in files if path.exists()), default=0.0)
    return f"{newest:.3f}"
