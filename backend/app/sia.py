"""IRSA SIA2 discovery for real SPHEREx Level-2 products.

The browser cannot query IRSA directly (no CORS headers); the backend can, and
it groups the individual detector exposures into survey visits ("epochs").
"""

from __future__ import annotations

import csv
import io
import json
import re
from dataclasses import dataclass
from typing import Any

from .cache import cache
from .config import SIA_CACHE_TTL, SIA_COLLECTIONS, SIA_URL
from .http import client

DETECTOR_RE = re.compile(r"D\s*([1-6])", re.IGNORECASE)
SEARCH_RADIUS_DEG = 0.04
MAX_EPOCHS = 6
EPOCH_GAP_DAYS = 10.0


@dataclass(frozen=True)
class Product:
    detector: int
    url: str
    mjd: float
    obs_id: str
    em_min: float
    em_max: float
    exptime: float | None


@dataclass(frozen=True)
class Visit:
    obs_id: str
    mjd: float
    products: dict[int, Product]


def _s3_url(cloud_access: str | None, fallback: str) -> str:
    bucket = "nasa-irsa-spherex"
    if cloud_access:
        match = re.search(r'"bucket_name"\s*:\s*"([^"]+)"', cloud_access)
        if match:
            bucket = match.group(1)

    # The IBE URL carries the S3 object key after /ibe/data/spherex/.
    marker = "/ibe/data/spherex/"
    if marker in fallback:
        key = fallback.split(marker, 1)[1]
        return f"https://{bucket}.s3.us-east-1.amazonaws.com/{key}"
    return fallback


def _detector_from_row(row: dict[str, str]) -> int | None:
    for field in ("energy_bandpassname", "obs_id", "access_url"):
        value = row.get(field) or ""
        match = DETECTOR_RE.search(value)
        if match:
            return int(match.group(1))
    return None


def _float(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def query_sia(
    ra: float,
    dec: float,
    radius_deg: float,
    collection: str,
    *,
    maxrec: int = 400,
) -> list[dict[str, str]]:
    """Return raw SIA2 rows for one collection (cached for an hour)."""

    key = cache.key("sia-v2", collection, round(ra, 4), round(dec, 4), round(radius_deg, 4), maxrec)
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    params = {
        "COLLECTION": collection,
        "POS": f"circle {ra:.5f} {dec:.5f} {radius_deg:.4f}",
        "RESPONSEFORMAT": "CSV",
        "MAXREC": str(maxrec),
    }
    response = client.get(SIA_URL, params=params)
    response.raise_for_status()
    rows = list(csv.DictReader(io.StringIO(response.text)))
    if rows:
        cache.put_json(key, rows, ttl=SIA_CACHE_TTL)
    return rows


def build_visits(rows: list[dict[str, str]]) -> list[Visit]:
    """Group SIA2 rows into visits (obs_id) with one product per detector."""

    by_visit: dict[str, dict[str, Any]] = {}
    for row in rows:
        if (row.get("dataproduct_type") or "image") != "image":
            continue
        detector = _detector_from_row(row)
        url = _s3_url(row.get("cloud_access"), row.get("access_url") or "")
        if detector is None or not url:
            continue
        mjd = _float(row.get("t_min")) or _float(row.get("t_max")) or 0.0
        obs_id = row.get("obs_id") or row.get("obs_publisher_did") or "unknown"
        visit = by_visit.setdefault(obs_id, {"mjd": mjd, "products": {}})
        visit["mjd"] = min(visit["mjd"], mjd) if visit["mjd"] else mjd
        existing = visit["products"].get(detector)
        product = Product(
            detector=detector,
            url=url,
            mjd=mjd,
            obs_id=obs_id,
            em_min=_float(row.get("em_min")) or 0.0,
            em_max=_float(row.get("em_max")) or 0.0,
            exptime=_float(row.get("t_exptime")),
        )
        # Keep the earliest exposure per detector; later duplicates add nothing
        # for a static preview and double the download.
        if existing is None or product.mjd < existing.mjd:
            visit["products"][detector] = product

    visits = [
        Visit(obs_id=obs_id, mjd=data["mjd"], products=data["products"])
        for obs_id, data in by_visit.items()
        if data["products"]
    ]
    visits.sort(key=lambda visit: visit.mjd)
    return visits


def cluster_epochs(visits: list[Visit], max_epochs: int = MAX_EPOCHS) -> list[tuple[float, dict[int, Product]]]:
    """Cluster visits into survey epochs and pick one visit per epoch."""

    if not visits:
        return []

    clusters: list[list[Visit]] = [[visits[0]]]
    for visit in visits[1:]:
        if visit.mjd - clusters[-1][-1].mjd > EPOCH_GAP_DAYS:
            clusters.append([visit])
        else:
            clusters[-1].append(visit)

    epochs: list[tuple[float, dict[int, Product]]] = []
    for cluster in clusters:
        center = sum(v.mjd for v in cluster) / len(cluster)
        best = min(cluster, key=lambda visit: abs(visit.mjd - center))
        # Fill missing detectors from the other visits in the same cluster.
        merged: dict[int, Product] = dict(best.products)
        for visit in sorted(cluster, key=lambda item: abs(item.mjd - center)):
            for detector, product in visit.products.items():
                merged.setdefault(detector, product)
        epochs.append((center, merged))

    if len(epochs) > max_epochs:
        step = (len(epochs) - 1) / (max_epochs - 1)
        epochs = [epochs[round(i * step)] for i in range(max_epochs)]
    return epochs


COVERED_INDEX_KEY = "covered-index-v1"
COVERED_INDEX_TTL = 30 * 24 * 60 * 60


def remembered_fields() -> list[dict[str, float]]:
    """Fields already confirmed to have products (keeps random picks useful)."""

    return cache.get_json(COVERED_INDEX_KEY) or []


def remember_field(ra: float, dec: float) -> None:
    fields = remembered_fields()
    if any(abs(item["ra"] - ra) < 0.5 and abs(item["dec"] - dec) < 0.5 for item in fields):
        return
    fields.append({"ra": ra, "dec": dec})
    cache.put_json(COVERED_INDEX_KEY, fields[-200:], ttl=COVERED_INDEX_TTL)


def coverage(
    ra: float,
    dec: float,
    fov: float,
    *,
    collections: tuple[str, ...] = SIA_COLLECTIONS,
    radius_deg: float | None = None,
) -> dict[str, Any]:
    """Describe real-data coverage for a field.

    ``radius_deg`` lets a caller widen the SIA2 cone (for example the spectrum
    extractor, whose point may sit near the edge of a large field); the default
    keeps the narrow search used for frame discovery.
    """

    radius = radius_deg if radius_deg is not None else max(SEARCH_RADIUS_DEG, min(0.1, fov * 0.1))
    key = (
        cache.key("coverage-v2", round(ra, 4), round(dec, 4), round(fov, 3), collections)
        if radius_deg is None
        else cache.key(
            "coverage-wide-v2",
            round(ra, 4),
            round(dec, 4),
            round(fov, 3),
            round(radius, 4),
            collections,
        )
    )
    cached = cache.get_json(key)
    if cached is not None:
        return cached

    chosen: str | None = None
    rows: list[dict[str, str]] = []
    failures = 0
    for collection in collections:
        try:
            rows = query_sia(ra, dec, radius, collection)
        except Exception:  # noqa: BLE001 - upstream failure is a normal state
            failures += 1
            continue
        if rows:
            chosen = collection
            break

    visits = build_visits(rows)
    epochs = cluster_epochs(visits)

    result = {
        "ra": ra,
        "dec": dec,
        "fov": fov,
        "covered": bool(epochs),
        # Distinguish "the archive says there is nothing here" from "the archive
        # could not be reached": the UI must not blame the sky for an outage.
        "archiveError": bool(failures) and failures == len(collections),
        "collection": chosen,
        "productCount": len(rows),
        "epochs": [
            {
                "index": index,
                "mjd": round(mjd, 5),
                "obsId": min(products.values(), key=lambda product: product.mjd).obs_id,
                "detectors": {
                    str(detector): {
                        "url": product.url,
                        "mjd": round(product.mjd, 5),
                        "emMin": product.em_min,
                        "emMax": product.em_max,
                        "exptime": product.exptime,
                    }
                    for detector, product in sorted(products.items())
                },
            }
            for index, (mjd, products) in enumerate(epochs)
        ],
    }
    cache.put_json(key, result, ttl=SIA_CACHE_TTL if result["covered"] else 60)
    if result["covered"]:
        remember_field(ra, dec)
    return result


def product_for(ra: float, dec: float, fov: float, epoch: int, detector: int) -> Product | None:
    """Resolve one (epoch, detector) product, reusing the cached coverage."""

    data = coverage(ra, dec, fov)
    if not data["covered"]:
        return None
    if epoch < 0 or epoch >= len(data["epochs"]):
        return None
    entry = data["epochs"][epoch]["detectors"].get(str(detector))
    if not entry:
        return None
    return Product(
        detector=detector,
        url=entry["url"],
        mjd=entry["mjd"],
        obs_id=data["epochs"][epoch]["obsId"],
        em_min=entry["emMin"],
        em_max=entry["emMax"],
        exptime=entry["exptime"],
    )
