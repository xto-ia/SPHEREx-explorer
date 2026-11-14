/**
 * Remembers the last sky field the user actually pointed at, so the coordinate
 * inputs survive a page reload instead of falling back to an empty form.
 *
 * Only three numbers are stored (nothing personal), and every access is
 * guarded because localStorage can be blocked by browser privacy settings.
 */

export const LAST_FIELD_STORAGE_KEY = 'spherex.lastField';

export interface SkyField {
  /** Right ascension, decimal degrees. */
  ra: number;
  /** Declination, decimal degrees. */
  dec: number;
  /** Field of view, degrees. */
  fov: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function readLastField(): SkyField | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_FIELD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SkyField>;
    if (!isFiniteNumber(parsed.ra) || !isFiniteNumber(parsed.dec) || !isFiniteNumber(parsed.fov)) {
      return null;
    }
    if (parsed.dec < -90 || parsed.dec > 90 || parsed.fov <= 0) return null;
    return { ra: parsed.ra, dec: parsed.dec, fov: parsed.fov };
  } catch {
    return null;
  }
}

export function saveLastField(field: SkyField): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_FIELD_STORAGE_KEY, JSON.stringify(field));
  } catch {
    // Private mode / quota: persistence is a convenience, never a requirement.
  }
}
