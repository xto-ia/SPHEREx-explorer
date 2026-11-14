/**
 * SPHEREx Level-2 FLAGS bits (SPHEREx Explanatory Supplement, Table 16).
 *
 * Only real science-contamination bits are highlighted in the UI. Bit 12
 * (FULLSAMPLE) and bit 21 (SOURCE) are nominal processing/source-mask bits that
 * are set on most valid pixels, so they must not be reported as contamination.
 */

export interface FlagBit {
  bit: number;
  name: string;
  nominal?: boolean;
}

export const FLAG_BITS: ReadonlyArray<FlagBit> = [
  { bit: 0, name: 'TRANSIENT' },
  { bit: 1, name: 'OVERFLOW' },
  { bit: 2, name: 'SUR_ERROR' },
  { bit: 6, name: 'NONFUNC' },
  { bit: 7, name: 'DICHROIC' },
  { bit: 9, name: 'MISSING_DATA' },
  { bit: 10, name: 'HOT' },
  { bit: 11, name: 'COLD' },
  { bit: 12, name: 'FULLSAMPLE', nominal: true },
  { bit: 14, name: 'PHANMISS' },
  { bit: 15, name: 'NONLINEAR' },
  { bit: 17, name: 'PERSIST' },
  { bit: 19, name: 'OUTLIER' },
  { bit: 20, name: 'CROSSTALK' },
  { bit: 21, name: 'SOURCE', nominal: true },
  { bit: 22, name: 'GHOST' },
  { bit: 25, name: 'STREAK' },
  { bit: 26, name: 'BLOOM' },
  { bit: 27, name: 'SNOWBALL' },
  { bit: 28, name: 'HALO' },
  { bit: 29, name: 'SATELLITE_HALO' },
];

/** Bits that actually warn about a compromised pixel. */
export const CONTAMINATION_MASK = FLAG_BITS.filter((flag) => !flag.nominal).reduce(
  (mask, flag) => mask | (1 << flag.bit),
  0,
);

export function isContaminated(value: number): boolean {
  return (value & CONTAMINATION_MASK) !== 0;
}

export function decodeFlags(value: number): FlagBit[] {
  return FLAG_BITS.filter((flag) => (value & (1 << flag.bit)) !== 0);
}

export function contaminationFlags(value: number): FlagBit[] {
  return decodeFlags(value).filter((flag) => !flag.nominal);
}
