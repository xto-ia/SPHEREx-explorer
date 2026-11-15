/**
 * SPHEREx Level-2 FLAGS bits (SPHEREx Explanatory Supplement, Table 16).
 *
 * Mirrors `backend/app/flags.py` bit for bit; change both together. The
 * severity classes follow the published recipes rather than intuition:
 *
 * - `unusable` — the pixels the L2 mosaic pipeline rejects (Supplement §3.4.3:
 *   TRANSIENT, SUR_ERROR, NONFUNC, DICHROIC, MISSING_DATA, HOT, COLD, PHANMISS,
 *   NONLINEAR, PERSIST, CROSSTALK, GHOST, GHOST_FPA, GHOST_EXT, STREAK, BLOOM,
 *   SNOWBALL, HALO, SATELLITE_HALO). It is the strictest official list.
 * - `caution` — bits the pipeline propagates instead of rejecting: OVERFLOW
 *   (threshold near half full well) and OUTLIER (Detect Outliers). A warning,
 *   not an invalidation.
 * - `nominal` — informational bits set on most valid pixels: FULLSAMPLE (full
 *   sample history exists) and SOURCE (pixel maps to a known source). They are
 *   never reported as contamination.
 */

export type FlagSeverity = 'unusable' | 'caution' | 'nominal';

export interface FlagBit {
  bit: number;
  name: string;
  severity: FlagSeverity;
}

export const FLAG_BITS: ReadonlyArray<FlagBit> = [
  { bit: 0, name: 'TRANSIENT', severity: 'unusable' },
  { bit: 1, name: 'OVERFLOW', severity: 'caution' },
  { bit: 2, name: 'SUR_ERROR', severity: 'unusable' },
  { bit: 6, name: 'NONFUNC', severity: 'unusable' },
  { bit: 7, name: 'DICHROIC', severity: 'unusable' },
  { bit: 9, name: 'MISSING_DATA', severity: 'unusable' },
  { bit: 10, name: 'HOT', severity: 'unusable' },
  { bit: 11, name: 'COLD', severity: 'unusable' },
  { bit: 12, name: 'FULLSAMPLE', severity: 'nominal' },
  { bit: 14, name: 'PHANMISS', severity: 'unusable' },
  { bit: 15, name: 'NONLINEAR', severity: 'unusable' },
  { bit: 17, name: 'PERSIST', severity: 'unusable' },
  { bit: 19, name: 'OUTLIER', severity: 'caution' },
  { bit: 20, name: 'CROSSTALK', severity: 'unusable' },
  { bit: 21, name: 'SOURCE', severity: 'nominal' },
  { bit: 22, name: 'GHOST', severity: 'unusable' },
  // Defined in Table 16 but not present in L2 images yet (GHOST_FPA) or not
  // released (GHOST_EXT). Decoded so a future release is never called clean.
  { bit: 23, name: 'GHOST_FPA', severity: 'unusable' },
  { bit: 24, name: 'GHOST_EXT', severity: 'unusable' },
  { bit: 25, name: 'STREAK', severity: 'unusable' },
  { bit: 26, name: 'BLOOM', severity: 'unusable' },
  { bit: 27, name: 'SNOWBALL', severity: 'unusable' },
  { bit: 28, name: 'HALO', severity: 'unusable' },
  { bit: 29, name: 'SATELLITE_HALO', severity: 'unusable' },
];

function maskFor(severity: FlagSeverity): number {
  return FLAG_BITS.filter((flag) => flag.severity === severity).reduce(
    (mask, flag) => mask | (1 << flag.bit),
    0,
  );
}

/** Pixels the L2 mosaic pipeline rejects. */
export const UNUSABLE_MASK = maskFor('unusable');
/** Propagated warnings: overflow near saturation, detected outliers. */
export const CAUTION_MASK = maskFor('caution');
/** Informational bits (FULLSAMPLE, SOURCE). */
export const NOMINAL_MASK = maskFor('nominal');
/** Every bit that means "do not fully trust this pixel". */
export const CONTAMINATION_MASK = UNUSABLE_MASK | CAUTION_MASK;
/** Every bit this build can name; anything else is reported as unknown. */
export const KNOWN_MASK = CONTAMINATION_MASK | NOMINAL_MASK;

export function isContaminated(value: number): boolean {
  return (value & CONTAMINATION_MASK) !== 0;
}

export function isUnusable(value: number): boolean {
  return (value & UNUSABLE_MASK) !== 0;
}

export function decodeFlags(value: number): FlagBit[] {
  return FLAG_BITS.filter((flag) => (value & (1 << flag.bit)) !== 0);
}

export function contaminationFlags(value: number): FlagBit[] {
  return decodeFlags(value).filter((flag) => flag.severity !== 'nominal');
}

export function nominalFlags(value: number): FlagBit[] {
  return decodeFlags(value).filter((flag) => flag.severity === 'nominal');
}

/** Set bits that are not in the published table (0 when fully decoded). */
export function unknownBits(value: number): number {
  return (value & ~KNOWN_MASK) >>> 0;
}
