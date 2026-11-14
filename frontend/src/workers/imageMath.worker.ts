/// <reference lib="webworker" />

/**
 * imageMath.worker.ts — display math for real SPHEREx planes.
 *
 * The backend resamples every epoch onto a common 480 × 480 sky grid, so the
 * worker only has to do the fast, interactive work: stretch to RGBA, co-add,
 * difference imaging with background removal, contamination overlays, pixel
 * probes and peak finding on the epoch difference.
 */

import type {
  CandidatesResponse,
  DisplayRequest,
  DisplayWorkerRequest,
  EpochFrameMessage,
  FrameResponse,
  FrameStats,
  LoadedResponse,
  LoadRequest,
  MoverCandidate,
  ProbeWorkerRequest,
  ProbeResponse,
  WorkerRequest,
  WorkerResponse,
} from '../lib/sky/workerTypes';
import { CONTAMINATION_MASK } from '../lib/sky/flags';
import { APP_CONFIG } from '../config/app.config';

interface StoredFrame {
  epochIndex: number;
  mjd: number;
  image: Float32Array;
  flags: Uint32Array;
  variance: Float32Array | null;
}

/** Per-pixel context shared by every epoch: the channel map and wavelength grid. */
let channelPlane: Uint8Array | null = null;
let wavelengthGrid: Float32Array | null = null;
let wavelengthShape = 0;

/** Parse `#rgb` / `#rrggbb` into 0–255 channels; white if the value is invalid. */
function parseHexColor(hex: string): [number, number, number] {
  const raw = hex.trim().replace(/^#/, '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw;
  if (expanded.length !== 6) return [255, 255, 255];
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return [255, 255, 255];
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** Display tint for normal (non-difference) frames, from the central config. */
const FRAME_TINT = parseHexColor(APP_CONFIG.render.frameColor);

const ctx = self as unknown as DedicatedWorkerGlobalScope;

let size = 480;
let ra0 = 0;
let dec0 = 0;
let bandKey = 'all';
let bandLabel = 'ALL';
let bandIndices: number[] = [];
let scaleArcsec = 6.15;
const frames = new Map<number, StoredFrame>();

function post(message: WorkerResponse, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

function reset() {
  frames.clear();
  channelPlane = null;
  wavelengthGrid = null;
  wavelengthShape = 0;
}

/** Bilinear lookup in the coarse WAVE-TAB grid sent with every frame. */
function wavelengthAt(x: number, y: number): number | null {
  if (!wavelengthGrid || wavelengthShape < 2) return null;
  const fx = Math.min(wavelengthShape - 1.0001, Math.max(0, (x / Math.max(size - 1, 1)) * (wavelengthShape - 1)));
  const fy = Math.min(wavelengthShape - 1.0001, Math.max(0, (y / Math.max(size - 1, 1)) * (wavelengthShape - 1)));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(wavelengthShape - 1, x0 + 1);
  const y1 = Math.min(wavelengthShape - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const top = wavelengthGrid[y0 * wavelengthShape + x0] * (1 - tx) + wavelengthGrid[y0 * wavelengthShape + x1] * tx;
  const bottom = wavelengthGrid[y1 * wavelengthShape + x0] * (1 - tx) + wavelengthGrid[y1 * wavelengthShape + x1] * tx;
  const value = top * (1 - ty) + bottom * ty;
  return Number.isFinite(value) ? value : null;
}

/**
 * Keep only the pixels the official channel map assigns to the selected
 * channel. A Level-2 spectral image measures exactly one channel per pixel, so
 * this is the honest way to show a monochromatic slice; everything else is set
 * to NaN and renders transparent.
 */
function restrictToChannel(
  pixels: Float32Array,
  flags: Uint32Array | null,
  request: DisplayRequest,
): Float32Array {
  const channel = request.channel ?? null;
  const maskFlags = Boolean(request.maskFlags);
  if (channel === null && !maskFlags) return pixels;
  if (channel !== null && !channelPlane) return pixels;
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 1) {
    if (channel !== null && channelPlane && channelPlane[i] !== channel) {
      out[i] = Number.NaN;
      continue;
    }
    if (maskFlags && flags && (flags[i] & CONTAMINATION_MASK) !== 0) {
      out[i] = Number.NaN;
      continue;
    }
    out[i] = pixels[i];
  }
  return out;
}

function percentile(sorted: Float32Array, fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)));
  return sorted[index];
}

function computeStats(pixels: Float32Array, flags: Uint32Array | null): FrameStats {
  const finite: number[] = [];
  let flagged = 0;
  for (let i = 0; i < pixels.length; i += 1) {
    const value = pixels[i];
    if (Number.isFinite(value)) finite.push(value);
    if (flags && (flags[i] & CONTAMINATION_MASK) !== 0) flagged += 1;
  }
  const sorted = Float32Array.from(finite).sort();
  return {
    p1: percentile(sorted, 0.01),
    median: percentile(sorted, 0.5),
    p99: percentile(sorted, 0.99),
    noise: Math.max((percentile(sorted, 0.84) - percentile(sorted, 0.16)) / 2, 1e-6),
    flaggedFraction: pixels.length ? flagged / pixels.length : 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

/**
 * One brightness reference for several planes (before/after pairs).
 *
 * Percentiles are taken over the union of the planes, each epoch contributing
 * equally, so the divider never hides a real flux change by normalising the
 * two halves independently.
 */
function computeStatsPair(planes: Float32Array[]): FrameStats {
  const values: number[] = [];
  for (const plane of planes) {
    for (let i = 0; i < plane.length; i += 1) {
      if (Number.isFinite(plane[i])) values.push(plane[i]);
    }
  }
  const sorted = Float32Array.from(values).sort();
  return {
    p1: percentile(sorted, 0.01),
    median: percentile(sorted, 0.5),
    p99: percentile(sorted, 0.99),
    noise: Math.max((percentile(sorted, 0.84) - percentile(sorted, 0.16)) / 2, 1e-6),
    flaggedFraction: 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  };
}

function stretchValue(value: number, mode: string, gain: number, low: number, high: number): number {
  const span = Math.max(high - low, 1e-9);
  const normalized = (value - low) / span;
  const scaled = Math.max(normalized, 0) * Math.max(gain, 0.01);
  switch (mode) {
    case 'linear':
      return Math.min(scaled, 1);
    case 'sqrt':
      return Math.min(Math.sqrt(scaled), 1);
    case 'log':
      return Math.min(Math.log10(1 + scaled * 9) , 1);
    case 'asinh':
    default:
      return Math.min(Math.asinh(scaled) / Math.asinh(1), 1);
  }
}

function toRgba(
  pixels: Float32Array,
  flags: Uint32Array | null,
  stats: FrameStats,
  stretch: { stretch: string; gain: number; palette: 'array' | 'signed'; showFlags: boolean },
): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(pixels.length * 4);
  const signed = stretch.palette === 'signed';
  const noise = Math.max(stats.noise, 1e-6);
  const median = stats.median;
  const signedScale = Math.max(Math.abs(stats.p99 - median), Math.abs(stats.p1 - median), noise * 10);
  const threshold = noise * 4;

  for (let i = 0; i < pixels.length; i += 1) {
    const value = pixels[i];
    const offset = i * 4;
    if (!Number.isFinite(value)) {
      rgba[offset + 3] = 0;
      continue;
    }
    if (signed) {
      const delta = value - median;
      if (Math.abs(delta) < threshold) {
        rgba[offset + 3] = 0;
        continue;
      }
      const strength = stretchValue(Math.abs(delta) - threshold, stretch.stretch, stretch.gain, 0, signedScale);
      if (value >= median) {
        rgba[offset] = 244;
        rgba[offset + 1] = 63 + Math.round(120 * (1 - strength));
        rgba[offset + 2] = 94 + Math.round(90 * (1 - strength));
      } else {
        rgba[offset] = 56;
        rgba[offset + 1] = 189 - Math.round(60 * (1 - strength));
        rgba[offset + 2] = 248;
      }
      rgba[offset + 3] = Math.round(50 + 205 * strength);
      continue;
    }
    const level = Math.round(255 * stretchValue(value, stretch.stretch, stretch.gain, stats.p1, stats.p99));
    // The planes are monochrome MJy/sr values, so their colour is a display
    // choice taken from APP_CONFIG.render.frameColor (white by default).
    rgba[offset] = Math.round((level * FRAME_TINT[0]) / 255);
    rgba[offset + 1] = Math.round((level * FRAME_TINT[1]) / 255);
    rgba[offset + 2] = Math.round((level * FRAME_TINT[2]) / 255);
    rgba[offset + 3] = 255;
    if (stretch.showFlags && flags && (flags[i] & CONTAMINATION_MASK) !== 0) {
      rgba[offset] = 245;
      rgba[offset + 1] = 158;
      rgba[offset + 2] = 11;
      rgba[offset + 3] = 255;
    }
  }
  return rgba;
}

function coadd(method: 'sum' | 'mean'): { pixels: Float32Array; flags: Uint32Array } {
  const out = new Float32Array(size * size);
  const counts = new Uint16Array(size * size);
  const union = new Uint32Array(size * size);

  for (const frame of frames.values()) {
    for (let i = 0; i < out.length; i += 1) {
      const value = frame.image[i];
      if (Number.isFinite(value)) {
        out[i] += value;
        counts[i] += 1;
      }
      union[i] |= frame.flags[i];
    }
  }
  if (method === 'mean') {
    for (let i = 0; i < out.length; i += 1) {
      if (counts[i] > 0) out[i] /= counts[i];
      else out[i] = Number.NaN;
    }
  } else {
    for (let i = 0; i < out.length; i += 1) {
      if (counts[i] === 0) out[i] = Number.NaN;
    }
  }
  return { pixels: out, flags: union };
}

/** Remove the smooth 2-D sky background so the epoch difference keeps sources. */
function flatten(pixels: Float32Array): Float32Array {
  const block = 48;
  const columns = Math.ceil(size / block);
  const grid = new Float32Array(columns * columns);
  const scratch: number[] = [];

  for (let gy = 0; gy < columns; gy += 1) {
    for (let gx = 0; gx < columns; gx += 1) {
      scratch.length = 0;
      const x0 = gx * block;
      const y0 = gy * block;
      const x1 = Math.min(size, x0 + block);
      const y1 = Math.min(size, y0 + block);
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const value = pixels[y * size + x];
          if (Number.isFinite(value)) scratch.push(value);
        }
      }
      if (scratch.length === 0) {
        grid[gy * columns + gx] = 0;
      } else {
        scratch.sort((a, b) => a - b);
        grid[gy * columns + gx] = scratch[Math.floor(scratch.length / 2)];
      }
    }
  }

  const out = new Float32Array(pixels.length);
  for (let y = 0; y < size; y += 1) {
    const fy = Math.min(columns - 1.0001, Math.max(0, (y + 0.5) / block - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(columns - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < size; x += 1) {
      const fx = Math.min(columns - 1.0001, Math.max(0, (x + 0.5) / block - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(columns - 1, x0 + 1);
      const tx = fx - x0;
      const top = grid[y0 * columns + x0] * (1 - tx) + grid[y0 * columns + x1] * tx;
      const bottom = grid[y1 * columns + x0] * (1 - tx) + grid[y1 * columns + x1] * tx;
      const background = top * (1 - ty) + bottom * ty;
      const index = y * size + x;
      const value = pixels[index];
      out[index] = Number.isFinite(value) ? value - background : Number.NaN;
    }
  }
  return out;
}

function blur(pixels: Float32Array, sigma = 1.2): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const value = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    kernel[i + radius] = value;
    sum += value;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= sum;

  const horizontal = new Float32Array(pixels.length);
  const output = new Float32Array(pixels.length);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let total = 0;
      let weight = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const xx = x + k;
        if (xx < 0 || xx >= size) continue;
        const value = pixels[y * size + xx];
        if (!Number.isFinite(value)) continue;
        total += value * kernel[k + radius];
        weight += kernel[k + radius];
      }
      horizontal[y * size + x] = weight > 0 ? total / weight : Number.NaN;
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let total = 0;
      let weight = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const yy = y + k;
        if (yy < 0 || yy >= size) continue;
        const value = horizontal[yy * size + x];
        if (!Number.isFinite(value)) continue;
        total += value * kernel[k + radius];
        weight += kernel[k + radius];
      }
      output[y * size + x] = weight > 0 ? total / weight : Number.NaN;
    }
  }
  return output;
}

function difference(epochA: number, epochB: number): { pixels: Float32Array; flags: Uint32Array } | null {
  const a = frames.get(epochA);
  const b = frames.get(epochB);
  if (!a || !b) return null;
  // A light PSF-scale smooth suppresses sub-pixel sampling residuals before
  // differencing; real motion and variability survive the convolution.
  const flatA = blur(flatten(a.image));
  const flatB = blur(flatten(b.image));
  const statsA = computeStats(flatA, null);
  const statsB = computeStats(flatB, null);
  const thresholdA = statsA.noise * 3;
  const thresholdB = statsB.noise * 3;
  const out = new Float32Array(size * size);
  const flags = new Uint32Array(size * size);
  const staticMask = new Uint8Array(size * size);

  for (let i = 0; i < out.length; i += 1) {
    const va = flatA[i];
    const vb = flatB[i];
    if (!Number.isFinite(va) || !Number.isFinite(vb)) {
      out[i] = Number.NaN;
      flags[i] = a.flags[i] | b.flags[i];
      continue;
    }
    const ratio = (va + 1e-6) / (vb + 1e-6);
    // A source that is present in both epochs at this pixel is static (or a
    // weak variable); its PSF sampling residuals are not a kinematic signal.
    if (va > thresholdA && vb > thresholdB && ratio > 0.5 && ratio < 2) {
      staticMask[i] = 1;
    }
    out[i] = vb - va;
    flags[i] = a.flags[i] | b.flags[i];
  }

  // Dilate the static mask by the PSF footprint so the wings of bright stars
  // do not leak into the difference either.
  const radius = 3;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (staticMask[y * size + x] === 0) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= size) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= size) continue;
          out[yy * size + xx] = Number.NaN;
        }
      }
    }
  }

  return { pixels: out, flags };
}

const pixelScale = () => scaleArcsec;

function skyFromPixel(x: number, y: number): { ra: number; dec: number; xArcsec: number; yArcsec: number } {
  const center = (size - 1) / 2;
  const xArcsec = -(x - center) * pixelScale();
  const yArcsec = -(y - center) * pixelScale();
  const dec = dec0 + yArcsec / 3600;
  const ra = (ra0 + xArcsec / (3600 * Math.max(Math.cos((dec0 * Math.PI) / 180), 0.05)) + 360) % 360;
  return { ra, dec, xArcsec, yArcsec };
}

function handleLoad(message: LoadRequest) {
  size = message.size;
  ra0 = message.ra;
  dec0 = message.dec;
  bandKey = message.band.bandKey;
  bandLabel = message.band.bandLabel;
  bandIndices = message.band.bandIndices;
  scaleArcsec = (message.fov * 3600) / message.size;
  reset();
  const response: LoadedResponse = { type: 'loaded', size };
  post(response);
}

function handleFrameData(message: EpochFrameMessage) {
  frames.set(message.epochIndex, {
    epochIndex: message.epochIndex,
    mjd: message.mjd,
    image: message.image,
    flags: message.flags ?? new Uint32Array(size * size),
    variance: message.variance,
  });
  if (message.channel && message.channel.length) channelPlane = message.channel;
  if (message.wavelength && message.wavelength.length) {
    wavelengthGrid = message.wavelength;
    wavelengthShape = message.lambdaShape;
  }
}

function handleDisplay(message: DisplayWorkerRequest) {
  const started = performance.now();
  const request = message.request;
  let pixels: Float32Array | null = null;
  let flags: Uint32Array | null = null;
  let epochIndex = request.epochIndex;
  let epochA: number | undefined;
  let epochB: number | undefined;
  let mjd = frames.get(request.epochIndex)?.mjd ?? 0;
  let label = bandLabel;

  if (request.mode === 'compare') {
    const first = frames.get(request.epochA);
    const second = frames.get(request.epochB);
    if (!first || !second) throw new Error('epochs not loaded');
    const pixelsA = restrictToChannel(first.image, first.flags, request);
    const pixelsB = restrictToChannel(second.image, second.flags, request);
    const perFrame = request.compareScale === 'per-frame';
    const shared = perFrame ? null : computeStatsPair([pixelsA, pixelsB]);
    const statsA = shared ?? computeStats(pixelsA, first.flags);
    const statsB = shared ?? computeStats(pixelsB, second.flags);
    const rgbaA = toRgba(pixelsA, first.flags, statsA, request.stretch);
    const rgbaB = toRgba(pixelsB, second.flags, statsB, request.stretch);
    const flags = first.flags.buffer.slice(0) as ArrayBuffer;
    const response: FrameResponse = {
      type: 'frame',
      requestId: message.requestId,
      rgba: rgbaA.buffer as ArrayBuffer,
      rgbaB: rgbaB.buffer as ArrayBuffer,
      flags,
      stats: statsA,
      statsB: perFrame ? statsB : undefined,
      epochIndex: request.epochA,
      epochA: request.epochA,
      epochB: request.epochB,
      mjd: first.mjd,
      mjdB: second.mjd,
      bandLabel: `${bandLabel} · A|B`,
      meanWavelength: bandIndices.length ? 1 : 0,
      scaleArcsecPerPixel: scaleArcsec,
      mode: 'compare',
      computeMs: Math.round(performance.now() - started),
      cacheHits: frames.size,
    };
    post(response, [response.rgba, response.rgbaB as ArrayBuffer, flags]);
    return;
  }

  if (request.mode === 'raw') {
    const frame = frames.get(request.epochIndex);
    if (!frame) throw new Error('epoch not loaded');
    pixels = frame.image;
    flags = frame.flags;
    mjd = frame.mjd;
  } else if (request.mode === 'coadd') {
    const combined = coadd(request.coaddMethod);
    pixels = combined.pixels;
    flags = combined.flags;
    epochIndex = -1;
    label = `${bandLabel} · ${request.coaddMethod === 'mean' ? 'mean' : 'sum'}`;
    mjd = [...frames.values()].reduce((sum, frame) => sum + frame.mjd, 0) / Math.max(frames.size, 1);
  } else {
    const combined = difference(request.epochA, request.epochB);
    if (!combined) throw new Error('epochs not loaded');
    pixels = combined.pixels;
    flags = combined.flags;
    epochIndex = -1;
    epochA = request.epochA;
    epochB = request.epochB;
    label = `${bandLabel} · Δ`;
    mjd = frames.get(request.epochB)?.mjd ?? 0;
  }

  pixels = restrictToChannel(pixels, flags, request);
  if (request.channel) label = `${label} · ch ${request.channel}`;
  const stats = computeStats(pixels, flags);
  const rgba = toRgba(pixels, flags, stats, request.stretch);
  const response: FrameResponse = {
    type: 'frame',
    requestId: message.requestId,
    rgba: rgba.buffer as ArrayBuffer,
    flags: flags.buffer.slice(0) as ArrayBuffer,
    stats,
    epochIndex,
    epochA,
    epochB,
    mjd,
    bandLabel: label,
    meanWavelength: bandIndices.length ? 1 : 0,
    scaleArcsecPerPixel: scaleArcsec,
    mode: request.mode,
    computeMs: Math.round(performance.now() - started),
    cacheHits: frames.size,
  };
  post(response, [response.rgba, response.flags]);
  void bandKey;
}

function handleProbe(message: ProbeWorkerRequest) {
  const frame = frames.get(message.epochIndex);
  if (!frame) throw new Error('epoch not loaded');
  const x = Math.max(0, Math.min(size - 1, Math.round(message.x)));
  const y = Math.max(0, Math.min(size - 1, Math.round(message.y)));
  const index = y * size + x;
  const sky = skyFromPixel(x, y);
  const variance = frame.variance ? frame.variance[index] : Number.NaN;
  const response: ProbeResponse = {
    type: 'probe',
    requestId: message.requestId,
    value: Number.isFinite(frame.image[index]) ? frame.image[index] : Number.NaN,
    flags: frame.flags[index] ?? 0,
    ra: sky.ra,
    dec: sky.dec,
    xArcsec: sky.xArcsec,
    yArcsec: sky.yArcsec,
    sigma: Number.isFinite(variance) && variance >= 0 ? Math.sqrt(variance) : null,
    channel: channelPlane ? channelPlane[index] : 0,
    wavelength: wavelengthAt(x, y),
    bandwidth: null,
  };
  post(response);
}

function handleCandidates(message: Extract<WorkerRequest, { type: 'candidates' }>) {
  const combined = difference(message.epochA, message.epochB);
  if (!combined) throw new Error('epochs not loaded');
  const diff = combined.pixels;
  const stats = computeStats(diff, null);
  const sigma = Math.max(stats.noise, 1e-6);
  const threshold = Math.max(sigma * 6, 1e-6);
  const limit = Math.min(12, Math.max(1, message.limit ?? 8));

  const peaks: Array<{ x: number; y: number; value: number }> = [];
  for (let y = 2; y < size - 2; y += 1) {
    for (let x = 2; x < size - 2; x += 1) {
      const value = diff[y * size + x];
      if (!Number.isFinite(value) || Math.abs(value) < threshold) continue;
      let isPeak = true;
      for (let dy = -1; dy <= 1 && isPeak; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const neighbour = diff[(y + dy) * size + (x + dx)];
          if (Math.abs(neighbour) > Math.abs(value)) {
            isPeak = false;
            break;
          }
        }
      }
      if (isPeak) peaks.push({ x, y, value });
    }
  }

  peaks.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const candidates: MoverCandidate[] = [];
  for (const peak of peaks) {
    if (candidates.some((candidate) => Math.hypot(candidate.x - peak.x, candidate.y - peak.y) < 6)) {
      continue;
    }
    const sky = skyFromPixel(peak.x, peak.y);
    candidates.push({
      x: peak.x,
      y: peak.y,
      xArcsec: sky.xArcsec,
      yArcsec: sky.yArcsec,
      ra: sky.ra,
      dec: sky.dec,
      delta: peak.value,
      significance: Math.abs(peak.value) / sigma,
      sign: peak.value >= 0 ? 1 : -1,
    });
    if (candidates.length >= limit) break;
  }

  const response: CandidatesResponse = {
    type: 'candidates',
    requestId: message.requestId,
    candidates,
    threshold,
    sigma,
  };
  post(response);
}

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    switch (message.type) {
      case 'load':
        handleLoad(message);
        break;
      case 'frame-data':
        handleFrameData(message);
        break;
      case 'display':
        handleDisplay(message);
        break;
      case 'probe':
        handleProbe(message);
        break;
      case 'candidates':
        handleCandidates(message);
        break;
      case 'dispose':
        reset();
        break;
      default:
        break;
    }
  } catch (error) {
    post({
      type: 'error',
      requestId:
        'requestId' in message && typeof message.requestId === 'number' ? message.requestId : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
