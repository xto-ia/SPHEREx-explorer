"""SPHEREx Level-2 FLAGS bitmask (Explanatory Supplement, Table 16).

The table and the three severity classes below are the single source of truth
for the backend. `frontend/src/lib/sky/flags.ts` mirrors them bit for bit; if a
bit is added here it must be added there too.

Severity classes follow the published recipes rather than intuition:

* ``unusable`` — the pixels the L2 mosaic pipeline rejects (§3.4.3 of the
  Supplement: TRANSIENT, SUR_ERROR, NONFUNC, DICHROIC, MISSING_DATA, HOT, COLD,
  PHANMISS, NONLINEAR, PERSIST, CROSSTALK, GHOST, GHOST_FPA, GHOST_EXT, STREAK,
  BLOOM, SNOWBALL, HALO, SATELLITE_HALO). This is the strictest official list.
* ``caution`` — bits the pipeline *propagates* instead of rejecting: OVERFLOW
  (threshold near half full well) and OUTLIER (flagged by Detect Outliers).
  They warn about a pixel but do not invalidate it.
* ``nominal`` — informational bits that are set on most valid pixels:
  FULLSAMPLE (the full sample history exists) and SOURCE (the pixel maps to a
  known catalogue source). They are never reported as contamination.
"""

from __future__ import annotations

from typing import Literal

FlagSeverity = Literal["unusable", "caution", "nominal"]

# (bit, symbolic name, severity)
FLAG_BITS: tuple[tuple[int, str, FlagSeverity], ...] = (
    (0, "TRANSIENT", "unusable"),
    (1, "OVERFLOW", "caution"),
    (2, "SUR_ERROR", "unusable"),
    (6, "NONFUNC", "unusable"),
    (7, "DICHROIC", "unusable"),
    (9, "MISSING_DATA", "unusable"),
    (10, "HOT", "unusable"),
    (11, "COLD", "unusable"),
    (12, "FULLSAMPLE", "nominal"),
    (14, "PHANMISS", "unusable"),
    (15, "NONLINEAR", "unusable"),
    (17, "PERSIST", "unusable"),
    (19, "OUTLIER", "caution"),
    (20, "CROSSTALK", "unusable"),
    (21, "SOURCE", "nominal"),
    (22, "GHOST", "unusable"),
    # GHOST_FPA (23) and GHOST_EXT (24) are defined in Table 16 but the archive
    # notes that they do not appear in L2 images yet; they are decoded here so a
    # future release is not silently reported as "clean".
    (23, "GHOST_FPA", "unusable"),
    (24, "GHOST_EXT", "unusable"),
    (25, "STREAK", "unusable"),
    (26, "BLOOM", "unusable"),
    (27, "SNOWBALL", "unusable"),
    (28, "HALO", "unusable"),
    (29, "SATELLITE_HALO", "unusable"),
)


def _mask(severity: FlagSeverity) -> int:
    value = 0
    for bit, _name, level in FLAG_BITS:
        if level == severity:
            value |= 1 << bit
    return value


UNUSABLE_MASK = _mask("unusable")
CAUTION_MASK = _mask("caution")
NOMINAL_MASK = _mask("nominal")
#: Any bit that says "do not fully trust this pixel".
CONTAMINATION_MASK = UNUSABLE_MASK | CAUTION_MASK
#: Every bit this build knows how to name.
KNOWN_MASK = CONTAMINATION_MASK | NOMINAL_MASK

FLAG_NAMES: dict[int, str] = {bit: name for bit, name, _ in FLAG_BITS}


def contamination(value: int) -> bool:
    """True when the mask carries an unusable or caution bit."""

    return bool(int(value) & CONTAMINATION_MASK)


def unknown_bits(value: int) -> int:
    """Bits set in `value` that this build cannot name (0 when fully decoded)."""

    return int(value) & ~KNOWN_MASK & 0xFFFFFFFF


def describe(value: int) -> list[dict[str, object]]:
    """Decoded, named bits of one mask value."""

    return [
        {"bit": bit, "name": name, "severity": level}
        for bit, name, level in FLAG_BITS
        if int(value) & (1 << bit)
    ]
