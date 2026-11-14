"""Real catalogue overlays: Gaia DR3, WISE and CSA NEOSSat, queried server-side."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from typing import Any

from .cache import cache
from .config import GAIA_TAP_URL, IRSA_TAP_URL, OVERLAY_CACHE_TTL
from .neossat import neossat_overlay
from .tap import number, query, text


def gaia_overlay(ra: float, dec: float, radius_deg: float) -> list[dict[str, Any]]:
    key = cache.key("gaia-v2", round(ra, 4), round(dec, 4), round(radius_deg, 3))
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    adql = (
        "SELECT TOP 400 source_id, ra, dec, pmra, pmdec, parallax, phot_g_mean_mag "
        "FROM gaiadr3.gaia_source "
        f"WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', {ra:.5f}, {dec:.5f}, {radius_deg:.4f}))"
    )
    rows = query(GAIA_TAP_URL, adql)
    sources = [
        {
            "id": f"gaia-{row['source_id']}",
            "name": f"Gaia DR3 {row['source_id']}",
            "kind": "star",
            "ra": number(row["ra"]),
            "dec": number(row["dec"]),
            "pmRa": number(row.get("pmra")),
            "pmDec": number(row.get("pmdec")),
            "parallax": number(row.get("parallax")),
            "magnitude": number(row.get("phot_g_mean_mag")),
            "catalog": "gaia",
        }
        for row in rows
    ]
    cache.put_json(key, sources, ttl=OVERLAY_CACHE_TTL)
    return sources


def wise_overlay(ra: float, dec: float, radius_deg: float) -> list[dict[str, Any]]:
    key = cache.key("wise-v3", round(ra, 4), round(dec, 4), round(radius_deg, 3))
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    adql = (
        "SELECT TOP 400 designation, ra, dec, w1mpro, w2mpro, w3mpro, w4mpro "
        "FROM allwise_p3as_psd "
        f"WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', {ra:.5f}, {dec:.5f}, {radius_deg:.4f}))"
    )
    rows = query(IRSA_TAP_URL, adql, timeout=90.0)
    sources = [
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
    cache.put_json(key, sources, ttl=OVERLAY_CACHE_TTL)
    return sources


def overlays(
    ra: float,
    dec: float,
    fov: float,
    *,
    layers: tuple[str, ...] | None = None,
) -> dict[str, Any]:
    radius = max(0.05, min(fov * 0.6, 2.0))
    result: dict[str, Any] = {"radius": radius, "errors": []}

    # WISE is an all-sky TAP scan that takes tens of seconds, Gaia and NEOSSat
    # answer in a few; callers may request one group at a time so a slow archive
    # never holds the fast layers hostage.
    available = (
        ("gaia", gaia_overlay),
        ("wise", wise_overlay),
        ("neossat", neossat_overlay),
    )
    wanted = [entry for entry in available if layers is None or entry[0] in layers]
    for name, _ in available:
        if layers is None or name in layers:
            result[name] = []

    with ThreadPoolExecutor(max_workers=max(len(wanted), 1)) as pool:
        futures = {name: pool.submit(run, ra, dec, radius) for name, run in wanted}
        for name, _ in wanted:
            try:
                result[name] = futures[name].result()
            except Exception as error:  # noqa: BLE001 - degrade per layer
                result["errors"].append(f"{name}: {error}")

    return result
