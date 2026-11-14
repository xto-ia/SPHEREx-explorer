/**
 * The five official NASA Space Apps test targets.
 * Coordinates are the verbatim values from CHALLENGE.md / the mission brief.
 * Display names and descriptions live in src/i18n/translations.ts under `targets`.
 */

export type TargetSlug = 'barnard' | 'epsilon-indi-b' | 'wise-0855' | 'rw-aurigae' | 'r-draconis';

export interface TestTarget {
  slug: TargetSlug;
  /** Key inside the translated `targets` dictionary. */
  i18nKey: 'barnard' | 'epsilonIndiB' | 'wise0855' | 'rwAurigae' | 'rDraconis';
  /** Right ascension, decimal degrees (ICRS). */
  ra: number;
  /** Declination, decimal degrees (ICRS). */
  dec: number;
  raSexagesimal: string;
  decSexagesimal: string;
  /** Total proper motion in arcsec/yr, or null for stationary variables. */
  properMotion: number | null;
  /** Suggested field of view in degrees. */
  recommendedFov: number;
}

export const TEST_TARGETS: readonly TestTarget[] = [
  {
    slug: 'barnard',
    i18nKey: 'barnard',
    ra: 269.452075,
    dec: 4.693364,
    raSexagesimal: '17h57m48.498s',
    decSexagesimal: '+04°41′36.11″',
    properMotion: 10.3,
    recommendedFov: 0.5,
  },
  {
    slug: 'epsilon-indi-b',
    i18nKey: 'epsilonIndiB',
    ra: 331.04375,
    dec: -56.782778,
    raSexagesimal: '22h04m10.50s',
    decSexagesimal: '−56°46′58.0″',
    properMotion: 4.7,
    recommendedFov: 0.25,
  },
  {
    slug: 'wise-0855',
    i18nKey: 'wise0855',
    ra: 133.795129,
    dec: -7.245147,
    raSexagesimal: '08h55m10.831s',
    decSexagesimal: '−07°14′42.53″',
    properMotion: 8.1,
    recommendedFov: 0.5,
  },
  {
    slug: 'rw-aurigae',
    i18nKey: 'rwAurigae',
    ra: 76.9565,
    dec: 30.401417,
    raSexagesimal: '05h07m49.56s',
    decSexagesimal: '+30°24′05.1″',
    properMotion: null,
    recommendedFov: 0.5,
  },
  {
    slug: 'r-draconis',
    i18nKey: 'rDraconis',
    ra: 248.167625,
    dec: 66.754972,
    raSexagesimal: '16h32m40.23s',
    decSexagesimal: '+66°45′17.9″',
    properMotion: null,
    recommendedFov: 0.75,
  },
];

export const FOV_OPTIONS = [0.1, 0.25, 0.5, 1, 2, 5] as const;

export function findTargetBySlug(slug: string | null): TestTarget | undefined {
  if (!slug) return undefined;
  return TEST_TARGETS.find((target) => target.slug === slug);
}
