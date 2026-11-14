/**
 * Small formatting helpers shared by the workspace panels.
 */

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const absolute = Math.abs(value);
  if (absolute >= 1000) return value.toFixed(0);
  if (absolute >= 100) return value.toFixed(1);
  if (absolute >= 1) return value.toFixed(digits);
  if (absolute >= 0.01) return value.toFixed(3);
  if (absolute === 0) return '0';
  return value.toExponential(2);
}

export function formatPercent(fraction: number, digits = 2): string {
  if (!Number.isFinite(fraction)) return '—';
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatArcsec(arcsec: number, digits = 2): string {
  if (!Number.isFinite(arcsec)) return '—';
  if (Math.abs(arcsec) >= 3600) return `${(arcsec / 3600).toFixed(2)}°`;
  return `${arcsec.toFixed(digits)}″`;
}

export function formatPixelScale(arcsecPerPixel: number): string {
  if (!Number.isFinite(arcsecPerPixel)) return '—';
  if (arcsecPerPixel < 1) return `${arcsecPerPixel.toFixed(2)}″/px`;
  return `${arcsecPerPixel.toFixed(1)}″/px`;
}

export function formatUTCDateTime(mjd: number): string {
  const date = new Date((mjd - 40587) * 86_400 * 1000);
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

export function formatIsoDate(iso: string): string {
  return iso.slice(0, 10);
}

export function formatSigned(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}`;
}

export function hexFlags(value: number): string {
  return `0x${value.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
