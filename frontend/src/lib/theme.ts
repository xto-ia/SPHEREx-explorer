/**
 * Applies the configured accent colour to the CSS custom properties that every
 * accent-aware style in the app reads from (`--accent`, `--accent-bright`).
 *
 * The variables hold bare RGB triplets so Tailwind can compose opacity on top
 * of them, e.g. `bg-accent/60` → `rgb(var(--accent) / 0.6)`.
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const FALLBACK: Rgb = { r: 16, g: 185, b: 129 };

function parseHex(input: string): Rgb {
  const raw = input.trim().replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(raw)) {
    const [r, g, b] = raw.split('').map((char) => Number.parseInt(char + char, 16));
    return { r, g, b };
  }

  if (/^[0-9a-f]{6}$/i.test(raw)) {
    const value = Number.parseInt(raw, 16);
    return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
  }

  console.warn(`[theme] "${input}" is not a #rgb or #rrggbb colour — using the default accent.`);
  return FALLBACK;
}

/** Mixes the colour towards white, used for the "-bright" hover/emphasis tone. */
function lighten({ r, g, b }: Rgb, amount: number): Rgb {
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return { r: mix(r), g: mix(g), b: mix(b) };
}

const triplet = ({ r, g, b }: Rgb) => `${r} ${g} ${b}`;

export function applyAccentTheme(accentColor: string) {
  if (typeof document === 'undefined') return;

  const base = parseHex(accentColor);
  const bright = lighten(base, 0.28);
  const root = document.documentElement;

  root.style.setProperty('--accent', triplet(base));
  root.style.setProperty('--accent-bright', triplet(bright));
}
