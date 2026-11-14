/**
 * Client for the SPHEREx Explorer API (backend/).
 *
 * The backend talks to IRSA/CADC, parses FITS with astropy and resamples every
 * epoch onto a common sky grid; the browser only receives small float planes.
 */

export const API_BASE: string =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE ??
  'http://127.0.0.1:8787';

export interface CoverageEpoch {
  index: number;
  mjd: number;
  obsId: string;
  detectors: string[] | number[];
}

export interface Coverage {
  ra: number;
  dec: number;
  fov: number;
  covered: boolean;
  /** True when every archive query failed: an outage, not an empty sky. */
  archiveError?: boolean;
  collection: string | null;
  productCount: number;
  epochs: CoverageEpoch[];
  frameSize?: number;
}

export interface FrameChannel {
  index: number;
  detector: number;
  subchan: number;
  label: string;
  wavelength: number;
  wlMin: number;
  wlMax: number;
  R: number;
  bandwidth: number;
}

export interface FramePlane {
  ra: number;
  dec: number;
  fov: number;
  shape: number;
  epoch: number;
  detector: number;
  mjd: number | null;
  obsId: string | null;
  hasFlags: boolean;
  hasVariance: boolean;
  hasChannel: boolean;
  lambdaShape: number;
  pixelScaleArcsec: number;
  nativeShape: number;
  quickLook: boolean;
  channels: FrameChannel[];
  image: Float32Array;
  coverage: Uint8Array;
  /** Official per-pixel channel index (0-18); 0 = outside the nominal layout. */
  channel: Uint8Array;
  /** WAVE-TAB wavelength on a coarse (lambdaShape x lambdaShape) grid. */
  wavelength: Float32Array;
  variance: Float32Array | null;
  flags: Uint32Array | null;
}

export interface SpectrumPoint {
  wavelength: number | null;
  bandwidth: number | null;
  flux: number | null;
  fluxErr: number | null;
  channel: number | null;
  channelLabel: string | null;
  detector: number | null;
  subchan: number | null;
  mjd: number;
  obsId: string;
  npix: number;
  exptime: number;
  flags: number;
  flagFraction: number;
  offsetArcsec: number | null;
  recentred: boolean;
  snr: number | null;
}

export interface SpectrumData {
  ra: number;
  dec: number;
  unit: string;
  method: string;
  apertureFwhm: number;
  apertureArcsec: number;
  collection: string | null;
  productsAvailable: number;
  productsUsed: number;
  outsideChannels: number;
  visits: number;
  channelsCovered: number;
  channelRange: [number, number] | null;
  note: string;
  points: SpectrumPoint[];
  channelTable: FrameChannel[];
}

export interface OverlaySource {
  id: string;
  name: string;
  kind: string;
  ra: number;
  dec: number;
  catalog: 'gaia' | 'wise';
  pmRa?: number | null;
  pmDec?: number | null;
  magnitude?: number | null;
}

/** One real CSA NEOSSat frame as catalogued by CADC CAOM2. */
export interface NeossatObservation {
  id: string;
  obsId: string;
  name: string;
  ra: number;
  dec: number;
  fov: number | null;
  tMin: number | null;
  tMax: number | null;
  exposure: number | null;
  instrument: string | null;
  /** ICRS vertices of the real footprint polygon (s_region). */
  region: Array<[number, number]> | null;
  /** CADC target_moving flag; null when the archive could not be asked. */
  moving: boolean | null;
}

export type OverlayLayer = 'gaia' | 'wise' | 'neossat';

export interface OverlayData {
  radius: number;
  gaia?: OverlaySource[];
  wise?: OverlaySource[];
  neossat?: NeossatObservation[];
  counts: Partial<Record<OverlayLayer, number>>;
  errors: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}?${search.toString()}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError('OFFLINE', 0);
  }
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // keep the status text
    }
    throw new ApiError(detail, response.status);
  }
  return (await response.json()) as T;
}

export function fetchCoverage(ra: number, dec: number, fov: number): Promise<Coverage> {
  return request<Coverage>('/api/coverage', { ra, dec, fov });
}

export function fetchOverlays(
  ra: number,
  dec: number,
  fov: number,
  layers: OverlayLayer[] = ['gaia', 'wise', 'neossat'],
): Promise<OverlayData> {
  return request<OverlayData>('/api/overlays', { ra, dec, fov, layers: layers.join(',') });
}

export function fetchSpectrum(
  ra: number,
  dec: number,
  fov: number,
  options: { maxProducts?: number; flags?: boolean } = {},
): Promise<SpectrumData> {
  return request<RawSpectrum>('/api/spectrum', {
    ra,
    dec,
    fov,
    max_products: options.maxProducts ?? 96,
    flags: options.flags ? 1 : 0,
  }).then(toSpectrum);
}

interface RawSpectrum {
  ra: number;
  dec: number;
  unit: string;
  method: string;
  apertureFwhm: number;
  apertureArcsec: number;
  collection: string | null;
  productsAvailable: number;
  productsUsed: number;
  outsideChannels: number;
  visits: number;
  channelsCovered: number;
  channelRange: [number, number] | null;
  note: string;
  channelTable: FrameChannel[];
  wavelength: (number | null)[];
  bandwidth: (number | null)[];
  flux: (number | null)[];
  fluxErr: (number | null)[];
  channel: (number | null)[];
  channelLabel: (string | null)[];
  detector: (number | null)[];
  subchan: (number | null)[];
  mjd: number[];
  obsId: string[];
  npix: number[];
  exptime: number[];
  flags: number[];
  flagFraction: number[];
  offsetArcsec: (number | null)[];
  recentred: boolean[];
  snr: (number | null)[];
}

/** The API is column-oriented; the UI wants one object per measured visit. */
function toSpectrum(raw: RawSpectrum): SpectrumData {
  const points: SpectrumPoint[] = raw.mjd.map((mjd, index) => ({
    wavelength: raw.wavelength[index] ?? null,
    bandwidth: raw.bandwidth[index] ?? null,
    flux: raw.flux[index] ?? null,
    fluxErr: raw.fluxErr[index] ?? null,
    channel: raw.channel[index] ?? null,
    channelLabel: raw.channelLabel[index] ?? null,
    detector: raw.detector[index] ?? null,
    subchan: raw.subchan[index] ?? null,
    mjd,
    obsId: raw.obsId[index] ?? '',
    npix: raw.npix[index] ?? 0,
    exptime: raw.exptime[index] ?? 0,
    flags: raw.flags[index] ?? 0,
    flagFraction: raw.flagFraction[index] ?? 0,
    offsetArcsec: raw.offsetArcsec[index] ?? null,
    recentred: Boolean(raw.recentred[index]),
    snr: raw.snr[index] ?? null,
  }));
  return { ...raw, points };
}

export interface RandomField {
  ra: number;
  dec: number;
  fov: number;
  attempts: number;
  collection: string | null;
  epochs: number;
}

export function fetchRandomField(fov: number): Promise<RandomField> {
  return request<RandomField>('/api/random-field', { fov });
}

export async function fetchFrame(params: {
  ra: number;
  dec: number;
  fov: number;
  epoch: number;
  detector: number;
  shape?: number;
  flags?: boolean;
  variance?: boolean;
}): Promise<FramePlane> {
  const search = new URLSearchParams({
    ra: String(params.ra),
    dec: String(params.dec),
    fov: String(params.fov),
    epoch: String(params.epoch),
    detector: String(params.detector),
    shape: String(params.shape ?? 480),
    flags: params.flags ? '1' : '0',
    variance: params.variance === false ? '0' : '1',
  });
  const response = await fetch(`${API_BASE}/api/frame?${search.toString()}`).catch(() => {
    throw new ApiError('OFFLINE', 0);
  });
  if (!response.ok) {
    throw new ApiError(`frame unavailable (HTTP ${response.status})`, response.status);
  }
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
  const head = new Uint8Array(buffer, 0, 4);
  if (head[0] !== 0x53 || head[1] !== 0x50 || head[2] !== 0x58 || head[3] !== 0x46) {
    throw new ApiError('unexpected frame payload', 500);
  }
  const headerLength = view.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, headerLength))) as {
    ra: number;
    dec: number;
    fov: number;
    shape: number;
    epoch: number;
    detector: number;
    mjd: number | null;
    obsId: string | null;
    hasFlags: boolean;
    hasVariance: boolean;
    hasChannel: boolean;
    lambdaShape: number;
    pixelScaleArcsec: number;
    nativeShape: number;
    quickLook: boolean;
    channels: FrameChannel[];
  };
  const shape = header.shape;
  const pixels = shape * shape;
  const lambdaPixels = Math.max(0, header.lambdaShape) ** 2;
  let offset = 8 + headerLength;
  // Each plane gets its own ArrayBuffer: the worker transfers these buffers,
  // and `postMessage` throws DataCloneError when one buffer appears twice (or
  // when a view still aliases the whole response). Slicing also removes any
  // alignment assumption for the Uint32Array FLAGS plane.
  const image = new Float32Array(buffer.slice(offset, offset + pixels * 4));
  offset += pixels * 4;
  const coverage = new Uint8Array(buffer.slice(offset, offset + pixels));
  offset += pixels;
  const channel = new Uint8Array(buffer.slice(offset, offset + pixels));
  offset += pixels;
  const wavelength = new Float32Array(buffer.slice(offset, offset + lambdaPixels * 4));
  offset += lambdaPixels * 4;
  const variance = header.hasVariance
    ? new Float32Array(buffer.slice(offset, offset + pixels * 4))
    : null;
  if (header.hasVariance) offset += pixels * 4;
  const flags = header.hasFlags
    ? new Uint32Array(buffer.slice(offset, offset + pixels * 4))
    : null;

  return {
    ...header,
    image,
    coverage,
    channel,
    wavelength,
    variance,
    flags,
  };
}

export interface BandTable {
  channels: FrameChannel[];
  bands: Array<{ index: number; label: string; low: number; high: number }>;
  source: string;
  note: string;
}

export function fetchBands(): Promise<BandTable> {
  return request<BandTable>('/api/bands', {});
}

export async function apiHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}


