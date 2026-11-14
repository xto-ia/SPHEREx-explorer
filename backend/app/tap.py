"""Minimal IVOA TAP client that speaks VOTable.

Gaia, IRSA and CADC all answer TAP queries, but they do not agree on the
optional JSON output: IRSA wraps the VOTable in a JSON envelope and CADC's
``/argus`` rejects ``FORMAT=json`` outright. Parsing VOTable everywhere keeps a
single code path and, more importantly, surfaces ``QUERY_STATUS`` so an archive
error can never masquerade as "zero rows".
"""

from __future__ import annotations

import io
import math
from typing import Any

import numpy as np
from astropy.io.votable import parse as parse_votable

from .http import client


class TapError(RuntimeError):
    """An archive rejected the ADQL query or answered with a broken table."""


def query(url: str, adql: str, *, timeout: float = 90.0) -> list[dict[str, Any]]:
    response = client.get(
        url,
        params={"REQUEST": "doQuery", "LANG": "ADQL", "QUERY": adql},
        timeout=timeout,
    )
    response.raise_for_status()
    try:
        votable = parse_votable(io.BytesIO(response.content), verify=None)
    except Exception as error:  # noqa: BLE001 - astropy raises several types
        raise TapError(f"unreadable VOTable: {error}") from error

    for resource in votable.resources:
        for info in resource.infos:
            if info.name == "QUERY_STATUS" and str(info.value).strip().upper() != "OK":
                raise TapError(str(info.content or info.value))

    try:
        table_element = votable.get_first_table()
    except IndexError:
        return []
    table = table_element.to_table()

    # Some archives (IRSA) emit a positional ID such as "col_0" next to the real
    # column name, and astropy prefers the ID. Restore the human-readable names.
    fields = [field.name or field.ID for field in table_element.fields]
    if len(fields) == len(table.colnames):
        for current, wanted in zip(list(table.colnames), fields):
            if not wanted or current == wanted or wanted in table.colnames:
                continue
            table.rename_column(current, wanted)

    return [{name: row[name] for name in table.colnames} for row in table]


def number(value: Any) -> float | None:
    """VOTable cells arrive masked or as ``--`` when a column has no value."""

    if value is None or value is np.ma.masked:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if math.isfinite(numeric) else None


def text(value: Any) -> str | None:
    if value is None or value is np.ma.masked:
        return None
    result = str(value).strip()
    return None if not result or result == "--" else result


def region_polygon(region: Any) -> list[list[float]] | None:
    """Turn an STC-S region into ICRS vertices for the overlay canvas."""

    raw = text(region)
    if not raw:
        return None

    tokens = raw.split()
    shape = tokens[0].lower()
    numbers: list[float] = []
    for token in tokens[1:]:
        try:
            numbers.append(float(token))
        except ValueError:
            continue

    if shape == "polygon" and len(numbers) >= 6:
        return [[numbers[index], numbers[index + 1]] for index in range(0, len(numbers) - 1, 2)]

    if shape == "circle" and len(numbers) >= 3:
        centre_ra, centre_dec, radius = numbers[:3]
        cos_dec = max(math.cos(math.radians(centre_dec)), 1e-6)
        return [
            [
                centre_ra + radius * math.cos(step) / cos_dec,
                centre_dec + radius * math.sin(step),
            ]
            for step in ((index / 24) * 2 * math.pi for index in range(24))
        ]

    return None