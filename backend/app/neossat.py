"""Real CSA NEOSSat frames from the CADC CAOM2 archive.

CADC publishes NEOSSat metadata through its TAP service, which moved to
``/argus`` and answers in VOTable only, so every record here is ADQL metadata:
the exact footprint polygon from ``ivoa.ObsCore.s_region``, the exposure window,
the target name and the CADC ``target_moving`` flag. Nothing is interpolated;
a field with no NEOSSat frame gets an empty list and the UI says so.
"""

from __future__ import annotations

from typing import Any

from .cache import cache
from .config import CADC_TAP_URL, OVERLAY_CACHE_TTL
from .tap import TapError, number, query, region_polygon, text

# The archive holds hundreds of NEOSSat frames per square degree; the overlay is
# a locator, not a data download, so the list is capped.
MAX_OBSERVATIONS = 240


def _moving_flags(obs_ids: list[str]) -> dict[str, bool | None]:
    """CADC's ``target_moving`` flag per observation.

    A failure here only costs the honest ``moving: null`` (no track is drawn);
    the footprints themselves stay valid.
    """

    if not obs_ids:
        return {}
    quoted = ",".join("'" + obs_id.replace("'", "") + "'" for obs_id in obs_ids)
    adql = (
        "SELECT observationID, target_moving FROM caom2.Observation "
        f"WHERE collection = 'NEOSSAT' AND observationID IN ({quoted})"
    )
    try:
        rows = query(CADC_TAP_URL, adql)
    except Exception:  # noqa: BLE001 - the track layer is optional detail
        return {}

    flags: dict[str, bool | None] = {}
    for row in rows:
        obs_id = text(row.get("observationID"))
        if not obs_id:
            continue
        flag = number(row.get("target_moving"))
        flags[obs_id] = None if flag is None else bool(int(flag))
    return flags


def neossat_overlay(ra: float, dec: float, radius_deg: float) -> list[dict[str, Any]]:
    key = cache.key("neossat-v2", round(ra, 4), round(dec, 4), round(radius_deg, 3))
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    adql = (
        f"SELECT TOP {MAX_OBSERVATIONS} obs_id, target_name, s_ra, s_dec, s_fov, s_region, "
        "t_min, t_max, t_exptime, instrument_name "
        "FROM ivoa.ObsCore "
        "WHERE obs_collection = 'NEOSSAT' "
        f"AND 1=INTERSECTS(s_region, CIRCLE('ICRS', {ra:.5f}, {dec:.5f}, {radius_deg:.4f})) "
        "ORDER BY t_min"
    )
    rows = query(CADC_TAP_URL, adql, timeout=120.0)

    observations: dict[str, dict[str, Any]] = {}
    for row in rows:
        obs_id = text(row.get("obs_id"))
        centre_ra = number(row.get("s_ra"))
        centre_dec = number(row.get("s_dec"))
        if not obs_id or obs_id in observations or centre_ra is None or centre_dec is None:
            continue
        observations[obs_id] = {
            "id": f"neossat-{obs_id}",
            "obsId": obs_id,
            "name": text(row.get("target_name")) or f"NEOSSat {obs_id}",
            "ra": centre_ra,
            "dec": centre_dec,
            "fov": number(row.get("s_fov")),
            "tMin": number(row.get("t_min")),
            "tMax": number(row.get("t_max")),
            "exposure": number(row.get("t_exptime")),
            "instrument": text(row.get("instrument_name")),
            "region": region_polygon(row.get("s_region")),
            "moving": None,
        }

    moving = _moving_flags(list(observations))
    for obs_id, record in observations.items():
        record["moving"] = moving.get(obs_id)

    result = list(observations.values())
    cache.put_json(key, result, ttl=OVERLAY_CACHE_TTL)
    return result


__all__ = ["MAX_OBSERVATIONS", "TapError", "neossat_overlay"]