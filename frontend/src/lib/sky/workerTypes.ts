/**
 * Messages exchanged with imageMath.worker.ts.
 *
 * Real SPHEREx planes arrive from the backend already resampled onto a common
 * grid, so the worker only performs display math: stretching, co-addition,
 * difference imaging, flag overlays, peak finding and pixel probes.
 */

export type DisplayMode = 'raw' | 'coadd' | 'diff';
export type StretchName = 'asinh' | 'linear' | 'sqrt' | 'log';

export interface BandSelection {
  bandIndices: number[];
  bandLabel: string;
  bandKey: string;
  detector: number;
}

export interface EpochFrameMessage {
  type: 'frame-data';
  epochIndex: number;
  mjd: number;
  image: Float32Array;
  flags: Uint32Array | null;
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
  flags: ArrayBuffer;
  stats: FrameStats;
  epochIndex: number;
  epochA?: number;
  epochB?: number;
  mjd: number;
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
