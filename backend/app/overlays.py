"""Real catalogue overlays: Gaia DR3, WISE and CSA NEOSSat, queried server-side.

Every layer answers with two things: the rows themselves and a small metadata
block describing how complete they are. A layer that was cut down by its own
row budget must never look like "the sky is empty" — the workspace prints
"2 500 of 19 853" instead of silently pinning the badge at the limit.
"""

from __future__ import annotations

import math
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable

from .cache import cache
from .config import GAIA_TAP_URL, IRSA_TAP_URL, OVERLAY_CACHE_TTL
from .neossat import neossat_overlay
from .tap import number, query, text

# A dense 0.5 deg field holds tens of thousands of Gaia sources (Barnard's
# Star: 19 853). Markers stop being readable long before that, so one field
# returns at most this many — the brightest ones, ordered by G magnitude. The
# reply stays under a megabyte and the count is disclosed in the UI.
GAIA_LIMIT = 2500

# Extra rows fetched so that trimming to the square frame (the query uses the
# frame's bounding box, the viewport clips a tangent-plane square) cannot leave
# the layer short of its budget.
GAIA_SLACK = 64

Layer = tuple[list[dict[str, Any]], dict[str, Any]]


def _short_error(error: Exception) -> str:
    """Compact upstream failure text for the overlay panel."""

    message = str(error)
    lowered = message.lower()
    if "timed out" in lowered or "timeout" in lowered:
        return "timeout"
    if "502" in message:
        return "HTTP 502 (proxy)"
    if "503" in message:
        return "HTTP 503"
    if "quota" in lowered or "blocked" in lowered:
        return "blocked"
    return message[:160]


def _is_timeout(error: Exception) -> bool:
    lowered = str(error).lower()
    return "timed out" in lowered or "timeout" in lowered


def _with_retry(run: Callable[[], Layer], attempts: int = 2) -> Layer:
    """Retry a fast failure once, never a slow one.

    A refused connection or a 502 deserves a second try; another 60-second
    timeout would only triple the time the panel spends waiting for a dead
    archive, so timeouts surface immediately.
    """

    last: Exception | None = None
    for index in range(attempts):
        try:
            return run()
        except Exception as error:  # noqa: BLE001 - retried, then reported
            last = error
            if index + 1 >= attempts or _is_timeout(error):
                raise
            time.sleep(0.8 * (index + 1))
    assert last is not None
    raise last


# --------------------------------------------------------------------- geometry
def _box_where(ra: float, dec: float, fov: float) -> str:
    """ADQL box covering the frame.

    Gaia rejects POLYGON (HTTP 408) and a circle over-fetches by 2.4x, so the
    lookup uses the frame's bounding box and `_in_frame` trims the corners.
    """

    half = max(0.001, fov / 2.0)
    half_ra = min(180.0, half / max(math.cos(math.radians(dec)), 0.02))
    low = (ra - half_ra) % 360.0
    high = (ra + half_ra) % 360.0
    if low <= high:
        ra_clause = f"ra BETWEEN {low:.6f} AND {high:.6f}"
    else:  # the box wraps through RA = 0
        ra_clause = f"(ra >= {low:.6f} OR ra <= {high:.6f})"
    return (
        f"{ra_clause} AND dec BETWEEN {dec - half:.6f} AND {dec + half:.6f}"
    )


def _in_frame(item: dict[str, Any], ra: float, dec: float, fov: float) -> bool:
    """True when the source lands inside the square the viewport draws.

    This is the same tangent-plane test the browser uses (`skyToPixel`), so
    "in frame" means "on screen" — not "somewhere in the search cone".
    """

    half_arcsec = fov * 3600.0 / 2.0
    delta_ra = ((item["ra"] - ra + 540.0) % 360.0) - 180.0
    x = delta_ra * math.cos(math.radians(dec)) * 3600.0
    y = (item["dec"] - dec) * 3600.0
    return abs(x) <= half_arcsec and abs(y) <= half_arcsec


# ------------------------------------------------------------------------ Gaia
def _gaia_count(ra: float, dec: float, fov: float) -> int | None:
    """How many Gaia sources the frame really holds (for the "of N" readout)."""

    adql = (
        "SELECT COUNT(*) AS n FROM gaiadr3.gaia_source "
        f"WHERE {_box_where(ra, dec, fov)}"
    )
    try:
        rows = query(GAIA_TAP_URL, adql)
    except Exception:  # noqa: BLE001 - the total is context, not a dependency
        return None
    if not rows:
        return None
    value = number(rows[0].get("n"))
    return int(value) if value is not None else None


def gaia_overlay(
    ra: float,
    dec: float,
    fov: float,
    *,
    limit: int = GAIA_LIMIT,
) -> Layer:
    """Gaia DR3 sources inside the frame, brightest first.

    Ordering by `phot_g_mean_mag` makes the subset deterministic and spatially
    uniform: an unordered `TOP 400` returns whatever the table happens to hold
    first, which is a contiguous slab of the sky and looks like a clump.
    """

    limit = max(50, min(5000, int(limit)))
    key = cache.key("gaia-v3", round(ra, 4), round(dec, 4), round(fov, 3), limit)
    cached = cache.get_json(key)
    if cached is not None:
        return cached["items"], cached["meta"]

    adql = (
        f"SELECT TOP {limit + GAIA_SLACK} source_id, ra, dec, pmra, pmdec, "
        "parallax, phot_g_mean_mag "
        "FROM gaiadr3.gaia_source "
        f"WHERE {_box_where(ra, dec, fov)} "
        "ORDER BY phot_g_mean_mag"
    )
    rows = query(GAIA_TAP_URL, adql)
    sources = [
        {
            "id": f"gaia-{text(row.get('source_id'))}",
            "name": f"Gaia DR3 {text(row.get('source_id'))}",
            "kind": "star",
            "ra": number(row.get("ra")),
            "dec": number(row.get("dec")),
            "pmRa": number(row.get("pmra")),
            "pmDec": number(row.get("pmdec")),
            "parallax": number(row.get("parallax")),
            "magnitude": number(row.get("phot_g_mean_mag")),
            "catalog": "gaia",
        }
        for row in rows
        if number(row.get("ra")) is not None and number(row.get("dec")) is not None
    ]

    inside = [source for source in sources if _in_frame(source, ra, dec, fov)]
    truncated = len(sources) >= limit + GAIA_SLACK
    kept = inside[:limit]

    mag_limit: float | None = None
    total = len(kept)
    if truncated:
        magnitudes = [item["magnitude"] for item in kept if item["magnitude"] is not None]
        mag_limit = round(max(magnitudes), 2) if magnitudes else None
        counted = _gaia_count(ra, dec, fov)
        total = counted if counted is not None else len(kept)

    meta = {
        "returned": len(kept),
        "total": total,
        "truncated": truncated,
        "limit": limit,
        "magLimit": mag_limit,
    }
    cache.put_json(key, {"items": kept, "meta": meta}, ttl=OVERLAY_CACHE_TTL)
    return kept, meta


# ------------------------------------------------------------------------ WISE
def wise_overlay(ra: float, dec: float, radius_deg: float) -> Layer:
    key = cache.key("wise-v4", round(ra, 4), round(dec, 4), round(radius_deg, 3))
    cached = cache.get_json(key)
    if cached is not None:
        return cached["items"], cached["meta"]

    adql = (
        "SELECT TOP 400 designation, ra, dec, w1mpro, w2mpro, w3mpro, w4mpro "
        "FROM allwise_p3as_psd "
        f"WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', {ra:.5f}, {dec:.5f}, {radius_deg:.4f})) "
        "ORDER BY w1mpro"
    )
    rows = query(IRSA_TAP_URL, adql, timeout=60.0)
    items = [
        {
            "id": f"wise-{text(row['designation'])}",
            "name": text(row["designation"]) or "AllWISE source",
            "kind": "star",
            "ra": number(row["ra"]),
            "dec": number(row["dec"]),
            "w1": number(row.get("w1mpro")),
            "w2": number(row.get("w2mpro")),
            "w3": number(row.get("w3mpro")),
            "w4": number(row.get("w4mpro")),
            "catalog": "wise",
        }
        for row in rows
    ]
    meta = {
        "returned": len(items),
        "total": len(items),
        "truncated": len(rows) >= 400,
        "limit": 400,
        "magLimit": None,
    }
    cache.put_json(key, {"items": items, "meta": meta}, ttl=OVERLAY_CACHE_TTL)
    return items, meta


# --------------------------------------------------------------------- compose
def overlays(
    ra: float,
    dec: float,
    fov: float,
    *,
    layers: tuple[str, ...] | None = None,
) -> dict[str, Any]:
    # The search radius still covers the frame's diagonal for the two layers
    # that select by footprint; sources outside the square are filtered by the
    # viewport, and Gaia is already queried by the frame box.
    radius = max(0.05, min(fov * 0.75, 3.0))
    result: dict[str, Any] = {"radius": radius, "errors": [], "meta": {}}

    available: tuple[tuple[str, Callable[[], Layer]], ...] = (
        ("gaia", lambda: gaia_overlay(ra, dec, fov)),
        ("wise", lambda: wise_overlay(ra, dec, radius)),
        ("neossat", lambda: neossat_overlay(ra, dec, radius)),
    )
    wanted = [entry for entry in available if layers is None or entry[0] in layers]
    for name, _ in available:
        if layers is None or name in layers:
            result[name] = []

    with ThreadPoolExecutor(max_workers=max(len(wanted), 1)) as pool:
        futures = {name: pool.submit(_with_retry, run) for name, run in wanted}
        for name, _ in wanted:
            try:
                items, meta = futures[name].result()
                result[name] = items
                result["meta"][name] = meta
            except Exception as error:  # noqa: BLE001 - degrade per layer
                # An archive that cannot be reached is not an empty sky: the
                # panel prints the layer's status instead of a bare zero.
                result[name] = []
                result["errors"].append(f"{name}: {_short_error(error)}")

    return result
