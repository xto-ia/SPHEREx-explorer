/**
 * Coordinate helpers shared by the landing page form and the workspace URL state.
 * Pure functions, no DOM access.
 */

/** Decimal degrees -> "17h57m48.50s" (always wraps RA into 0–360). */
export function formatRa(deg: number): string {
  const wrapped = ((deg % 360) + 360) % 360;
  const hours = wrapped / 15;
  const h = Math.floor(hours);
  const minutes = (hours - h) * 60;
  const m = Math.floor(minutes);
  const s = (minutes - m) * 60;
  return `${h}h${String(m).padStart(2, '0')}m${s.toFixed(2).padStart(5, '0')}s`;
}

/** Decimal degrees -> "+04°41′36.1″". */
export function formatDec(deg: number): string {
  const sign = deg < 0 ? '−' : '+';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minutes = (abs - d) * 60;
  const m = Math.floor(minutes);
  const s = (minutes - m) * 60;
  return `${sign}${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}′${s.toFixed(1).padStart(4, '0')}″`;
}

/** Display helper: "269.452075° (17h57m48.50s)". */
export function formatRaLong(deg: number): string {
  return `${deg.toFixed(6)}° (${formatRa(deg)})`;
}

export function formatDecLong(deg: number): string {
  return `${deg.toFixed(6)}° (${formatDec(deg)})`;
}

const PLAIN_NUMBER_RE = /^[+\-−]?\d+(?:\.\d+)?$/;
const COMPONENT_RE = /^\d+(?:\.\d+)?$/;

/**
 * Splits a sexagesimal string into a sign and 1–3 numeric components.
 *
 * Every common separator is normalised to whitespace first, so unit letters
 * (`17h57m48.5s`, `-07d14m42.53s`), degree/prime symbols (`+04°41′36.11″`),
 * colons (`17:57:48.5`) and plain spaces (`17 57 48.5`) all parse the same way.
 */
function splitSexagesimal(value: string): { sign: number; parts: number[] } | null {
  const normalized = value
    .replace(/[hHdDmMsS]/g, ' ')
    .replace(/[°:′″'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  let sign = 1;
  let body = normalized;
  const leadingSign = body.match(/^([+\-−])\s*/);
  if (leadingSign) {
    if (leadingSign[1] === '-' || leadingSign[1] === '−') sign = -1;
    body = body.slice(leadingSign[0].length).trim();
  }
  if (!body) return null;

  const tokens = body.split(' ');
  if (tokens.length === 0 || tokens.length > 3) return null;

  const parts: number[] = [];
  for (const token of tokens) {
    if (!COMPONENT_RE.test(token)) return null;
    parts.push(Number(token));
  }

  return { sign, parts };
}

/**
 * Parses right ascension from `269.452075`, `17h57m48.498s`, `17 57 48.5`,
 * or colon separated `17:57:48.5`. Returns null when the input is unusable.
 */
export function parseRa(input: string): number | null {
  const value = input.trim();
  if (!value) return null;

  // A bare number is always decimal degrees; anything with separators is
  // sexagesimal hours.
  if (PLAIN_NUMBER_RE.test(value)) {
    const deg = Number(value.replace('−', '-'));
    return Number.isFinite(deg) ? normalize360(deg) : null;
  }

  const parsed = splitSexagesimal(value);
  if (!parsed) return null;

  const [hours = 0, minutes = 0, seconds = 0] = parsed.parts;
  if (minutes >= 60 || seconds >= 60) return null;

  return normalize360((hours + minutes / 60 + seconds / 3600) * 15 * parsed.sign);
}

/**
 * Parses declination from `+4.693364`, `-7d14m42.53s`, `+04°41′36.11″`,
 * or colon/space separated `+04:41:36.11` / `+04 41 36.11`. Returns null when
 * unusable.
 */
export function parseDec(input: string): number | null {
  const value = input.trim();
  if (!value) return null;

  if (PLAIN_NUMBER_RE.test(value)) {
    const deg = Number(value.replace('−', '-'));
    return Number.isFinite(deg) && deg >= -90 && deg <= 90 ? deg : null;
  }

  const parsed = splitSexagesimal(value);
  if (!parsed) return null;

  const [degrees = 0, minutes = 0, seconds = 0] = parsed.parts;
  if (minutes >= 60 || seconds >= 60) return null;

  const deg = (degrees + minutes / 60 + seconds / 3600) * parsed.sign;
  return deg >= -90 && deg <= 90 ? deg : null;
}

export function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Trims float noise for URLs: 269.452075 -> "269.452075". */
export function toUrlNumber(value: number, digits = 6): string {
  return String(Number(value.toFixed(digits)));
}
