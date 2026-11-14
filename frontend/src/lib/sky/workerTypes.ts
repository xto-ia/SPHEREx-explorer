/**
 * Messages exchanged with imageMath.worker.ts.
 *
 * Real SPHEREx planes arrive from the backend already resampled onto a common
 * grid, so the worker only performs display math: stretching, co-addition,
 * difference imaging, flag overlays, peak finding and pixel probes.
 */

export type DisplayMode = 'raw' | 'coadd' | 'diff' | 'compare';
export type StretchName = 'asinh' | 'linear' | 'sqrt' | 'log';
/**
 * Brightness reference for the before/after pair.
 *
 * `shared` stretches both halves with one p1/p99 taken over A ∪ B, so a real
 * brightness change between the epochs stays visible across the seam instead
 * of being normalised away. `per-frame` gives each half its own scale.
 */
export type CompareScale = 'shared' | 'per-frame';

export interface BandSelection {
  bandIndices: number[];
  bandLabel: string;
  bandKey: string;
  detector: number;
  /** Isolate one channel of the detector (1-17) or show the whole spectral image. */
  channel: number | null;
  /** Quick-look mean of all six detectors: never presented as a measurement. */
  quickLook: boolean;
}

export interface EpochFrameMessage {
  type: 'frame-data';
  epochIndex: number;
  mjd: number;
  image: Float32Array;
  flags: Uint32Array | null;
  /** VARIANCE plane in (MJy/sr)^2, when the backend could provide it. */
  variance: Float32Array | null;
  /** Official channel index per pixel (0-18). */
  channel: Uint8Array;
  /** WAVE-TAB wavelength on a coarse grid. */
  wavelength: Float32Array;
  lambdaShape: number;
  scaleArcsecPerPixel: number;
}

export interface LoadRequest {
  type: 'load';
  size: number;
  fov: number;
  ra: number;
  dec: number;
  band: BandSelection;
}

export interface DisplayRequest {
  mode: DisplayMode;
  epochIndex: number;
  epochA: number;
  epochB: number;
  stretch: { stretch: StretchName; gain: number; palette: 'array' | 'signed'; showFlags: boolean };
  coaddMethod: 'sum' | 'mean';
  /** Only read in `compare` mode; defaults to `shared`. */
  compareScale?: CompareScale;
  /** Mask every pixel whose official channel differs from this one (1-17). */
  channel?: number | null;
  /** Hide pixels whose FLAGS carry a contamination bit instead of tinting them. */
  maskFlags?: boolean;
}

export interface DisplayWorkerRequest {
  type: 'display';
  requestId: number;
  request: DisplayRequest;
}

export interface ProbeWorkerRequest {
  type: 'probe';
  requestId: number;
  epochIndex: number;
  x: number;
  y: number;
}

export interface CandidatesWorkerRequest {
  type: 'candidates';
  requestId: number;
  epochA: number;
  epochB: number;
  limit?: number;
}

export interface DisposeRequest {
  type: 'dispose';
}

export type WorkerRequest =
  | LoadRequest
  | EpochFrameMessage
  | DisplayWorkerRequest
  | ProbeWorkerRequest
  | CandidatesWorkerRequest
  | DisposeRequest;

export interface FrameStats {
  p1: number;
  median: number;
  p99: number;
  /** Robust 1σ noise estimate from the p16–p84 interval. */
  noise: number;
  flaggedFraction: number;
  min: number;
  max: number;
}

export interface FrameResponse {
  type: 'frame';
  requestId: number;
  rgba: ArrayBuffer;
  /** Second plane of a `compare` pair (right-hand / B side). */
  rgbaB?: ArrayBuffer;
  flags: ArrayBuffer;
  stats: FrameStats;
  /** `per-frame` compare only: statistics of the B plane. */
  statsB?: FrameStats;
  epochIndex: number;
  epochA?: number;
  epochB?: number;
  mjd: number;
  mjdB?: number;
  bandLabel: string;
  meanWavelength: number;
  scaleArcsecPerPixel: number;
  mode: DisplayMode;
  computeMs: number;
  cacheHits: number;
}

export interface ProbeResponse {
  type: 'probe';
  requestId: number;
  value: number;
  flags: number;
  ra: number;
  dec: number;
  xArcsec: number;
  yArcsec: number;
  /** 1σ surface-brightness uncertainty from the VARIANCE plane (MJy/sr). */
  sigma: number | null;
  /** Official channel index at the pixel (0-18). */
  channel: number;
  /** WAVE-TAB wavelength (um) and bandwidth from the official channel table. */
  wavelength: number | null;
  bandwidth: number | null;
}

export interface MoverCandidate {
  x: number;
  y: number;
  xArcsec: number;
  yArcsec: number;
  ra: number;
  dec: number;
  delta: number;
  significance: number;
  sign: number;
}

export interface CandidatesResponse {
  type: 'candidates';
  requestId: number;
  candidates: MoverCandidate[];
  threshold: number;
  sigma: number;
}

export interface LoadedResponse {
  type: 'loaded';
  size: number;
}

export interface ErrorResponse {
  type: 'error';
  requestId?: number;
  message: string;
}

export type WorkerResponse =
  | LoadedResponse
  | FrameResponse
  | ProbeResponse
  | CandidatesResponse
  | ErrorResponse;
