/**
 * Field types shared by the workspace.
 *
 * Everything here comes from the backend: real SPHEREx epochs discovered by
 * SIA2, resampled frames, catalogue overlays and extracted spectra.
 */

export interface FieldEpoch {
  index: number;
  mjd: number;
  obsId: string;
  detectors: number[];
  label: string;
  date: string;
  exposure: number | null;
}

const MJD_ZERO = 40_587; // 1858-11-17

export function mjdToDate(mjd: number): Date {
  return new Date((mjd - MJD_ZERO) * 86_400 * 1000);
}

export function mjdToIso(mjd: number): string {
  return mjdToDate(mjd).toISOString().slice(0, 10);
}

export function epochLabel(index: number, mjd: number): string {
  return `E${index + 1} · ${mjdToIso(mjd)}`;
}

/** Project an ICRS position onto the north-up, east-left frame grid. */
export function skyToPixel(
  ra: number,
  dec: number,
  centre: { ra: number; dec: number; fov: number },
  size: number,
): { x: number; y: number } {
  const scaleArcsec = (centre.fov * 3600) / size;
  const dRa = ((ra - centre.ra + 540) % 360) - 180;
  const xArcsec = dRa * Math.cos((centre.dec * Math.PI) / 180) * 3600;
  const yArcsec = (dec - centre.dec) * 3600;
  const centrePixel = (size - 1) / 2;
  return {
    x: centrePixel - xArcsec / scaleArcsec,
    y: centrePixel - yArcsec / scaleArcsec,
  };
}
