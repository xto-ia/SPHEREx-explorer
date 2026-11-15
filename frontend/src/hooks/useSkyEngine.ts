import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCoverage, fetchFrame, type Coverage, type FramePlane } from '../lib/api';
import { epochLabel, mjdToIso, type FieldEpoch } from '../lib/sky/field';
import type {
  BandSelection,
  CandidatesResponse,
  DisplayRequest,
  FrameResponse,
  FrameStats,
  ProbeResponse,
  WorkerRequest,
  WorkerResponse,
} from '../lib/sky/workerTypes';

export interface SkyFrame {
  rgba: Uint8ClampedArray;
  /** Right-hand plane of a `compare` pair; undefined in every other mode. */
  rgbaB?: Uint8ClampedArray;
  flags: Uint8Array;
  /** Display grid this frame was computed on; `rgba.length` must match it. */
  size: number;
  /** False when a product on screen has no decoded FLAGS extension. */
  flagsAvailable: boolean;
  stats: FrameResponse['stats'];
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
  mode: DisplayRequest['mode'];
  computeMs: number;
  cacheHits: number;
}

export interface SkyEngine {
  coverage: Coverage | null;
  epochs: FieldEpoch[];
  frame: SkyFrame | null;
  ready: boolean;
  rendering: boolean;
  /** A new display grid is being downloaded; the viewport has no frame yet. */
  gridLoading: boolean;
  status: string | null;
  error: string | null;
  size: number;
  loadedCount: number;
  flagsAvailable: boolean;
  /** Channels (1-17) that actually occur in the current cutout. */
  availableChannels: number[];
  /** Detector-native pixel scale and the grid size that matches it. */
  pixelScaleArcsec: number;
  nativeShape: number;
  quickLook: boolean;
  render: (request: DisplayRequest) => void;
  probe: (epochIndex: number, x: number, y: number) => Promise<ProbeResponse>;
  findCandidates: (
    epochA: number,
    epochB: number,
    limit?: number,
  ) => Promise<{ candidates: CandidatesResponse['candidates']; threshold: number; sigma: number }>;
}

interface PendingResolver {
  resolve: (value: never) => void;
  reject: (reason: Error) => void;
  timer: number;
}

const FRAME_SIZE = 480;
const MAX_EPOCHS = 6;

/** `/api/coverage` returns detector details keyed by number; normalise to ints. */
function epochDetectors(epoch: Coverage['epochs'][number]): number[] {
  const value = epoch.detectors as unknown;
  if (Array.isArray(value)) return value.map(Number);
  return Object.keys(value as Record<string, unknown>).map(Number);
}

function detectorExposure(epoch: Coverage['epochs'][number], detector: number): number | null {
  const value = epoch.detectors as unknown;
  if (Array.isArray(value)) return null;
  const entry = (value as Record<string, { exptime?: number }>)[String(detector)];
  return entry?.exptime ?? null;
}

export function useSkyEngine(options: {
  ra: number;
  dec: number;
  fov: number;
  detector: number;
  shape?: number;
  band: BandSelection;
}): SkyEngine {
  const { ra, dec, fov, detector, band } = options;
  const shape = options.shape ?? FRAME_SIZE;

  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [frame, setFrame] = useState<SkyFrame | null>(null);
  const [ready, setReady] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [flagsAvailable, setFlagsAvailable] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<number[]>([]);
  const [pixelScaleArcsec, setPixelScaleArcsec] = useState(6.15);
  const [nativeShape, setNativeShape] = useState(FRAME_SIZE);

  // The worker compares responses against the grid the UI currently draws, so
  // the size must be readable from the long-lived message handler.
  const sizeRef = useRef(shape);
  sizeRef.current = shape;

  // The band label is stable per detector; the selected channel changes on
  // every click and must not reload the frames, so the load effect reads it
  // through a ref.
  const bandRef = useRef(band);
  bandRef.current = band;

  const workerRef = useRef<Worker | null>(null);
  const resolversRef = useRef(new Map<number, PendingResolver>());
  const requestIdRef = useRef(0);
  const displayRef = useRef(0);
  const loadedEpochsRef = useRef(new Set<number>());
  const pendingDisplayRef = useRef<DisplayRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ------------------------------------------------------------- worker */
  useEffect(() => {
    const worker = new Worker(new URL('../workers/imageMath.worker.ts', import.meta.url), {
      type: 'module',
      name: 'spherex-image-math',
    });
    workerRef.current = worker;

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'loaded') {
        setReady(true);
        return;
      }
      if (message.type === 'frame') {
        if (message.requestId !== displayRef.current) return;
        // A response computed on the previous grid must never be painted at the
        // new one: the RGBA buffer length would not match the canvas.
        if (message.size !== sizeRef.current) return;
        setRendering(false);
        setError(null);
        setFrame({
          rgba: new Uint8ClampedArray(message.rgba),
          rgbaB: message.rgbaB ? new Uint8ClampedArray(message.rgbaB) : undefined,
          flags: new Uint8Array(message.flags),
          size: message.size,
          flagsAvailable: message.flagsAvailable,
          stats: message.stats,
          statsB: message.statsB,
          epochIndex: message.epochIndex,
          epochA: message.epochA,
          epochB: message.epochB,
          mjd: message.mjd,
          mjdB: message.mjdB,
          bandLabel: message.bandLabel,
          meanWavelength: message.meanWavelength,
          scaleArcsecPerPixel: message.scaleArcsecPerPixel,
          mode: message.mode,
          computeMs: message.computeMs,
          cacheHits: message.cacheHits,
        });
        return;
      }
      if (message.type === 'probe' || message.type === 'candidates') {
        const resolver = resolversRef.current.get(message.requestId);
        if (!resolver) return;
        clearTimeout(resolver.timer);
        resolversRef.current.delete(message.requestId);
        (resolver.resolve as unknown as (value: unknown) => void)(message);
        return;
      }
      if (message.type === 'error') {
        setRendering(false);
        setError(message.message);
        if (message.requestId !== undefined) {
          const resolver = resolversRef.current.get(message.requestId);
          if (resolver) {
            clearTimeout(resolver.timer);
            resolversRef.current.delete(message.requestId);
            resolver.reject(new Error(message.message));
          }
        }
      }
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
      for (const resolver of resolversRef.current.values()) {
        clearTimeout(resolver.timer);
        resolver.reject(new Error('worker terminated'));
      }
      resolversRef.current.clear();
    };
  }, []);

  const post = useCallback((message: WorkerRequest, transfer: Transferable[] = []) => {
    workerRef.current?.postMessage(message, transfer);
  }, []);

  /* ---------------------------------------------------------- discovery */
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setCoverage(null);
    setFrame(null);
    setError(null);
    setStatus('discovering archive products');
    loadedEpochsRef.current.clear();

    fetchCoverage(ra, dec, fov)
      .then((data) => {
        if (controller.signal.aborted) return;
        setCoverage(data);
        if (!data.covered) {
          setStatus(null);
          setError(data.archiveError ? 'ARCHIVE UNREACHABLE' : 'NO COVERAGE');
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setStatus(null);
        setError(cause instanceof Error ? cause.message : 'archive query failed');
      });

    return () => controller.abort();
  }, [ra, dec, fov]);

  const epochs = useMemo<FieldEpoch[]>(() => {
    if (!coverage?.covered) return [];
    return coverage.epochs
      .filter((epoch) => epoch.index < MAX_EPOCHS)
      // The timeline, playback and scrubber must only offer epochs that the
      // loader can actually fetch for the active detector.
      .filter((epoch) => {
        if (detector === 0) return epochDetectors(epoch).length > 0;
        return epochDetectors(epoch).includes(detector);
      })
      .map((epoch, position) => {
        return {
          index: epoch.index,
          mjd: epoch.mjd,
          obsId: epoch.obsId,
          detectors: epochDetectors(epoch),
          label: epochLabel(position, epoch.mjd),
          date: mjdToIso(epoch.mjd),
          exposure: detectorExposure(epoch, detector),
        };
      });
  }, [coverage, detector]);

  /* ------------------------------------------------------------- loading */
  useEffect(() => {
    if (!coverage?.covered) return undefined;

    const controller = new AbortController();
    const wanted = coverage.epochs
      .filter((epoch) => epoch.index < MAX_EPOCHS)
      .filter((epoch) => {
        if (detector === 0) return epochDetectors(epoch).length > 0;
        return epochDetectors(epoch).includes(detector);
      })
      .sort((a, b) => a.mjd - b.mjd);
    if (wanted.length === 0) {
      setError('no detector data for this field');
      return undefined;
    }

    loadedEpochsRef.current.clear();
    // The old frame belongs to the previous grid: drop it so the viewport can
    // never paint a 480² buffer at native-sampling dimensions (and never show
    // stale pixels as if they were the new sampling).
    pendingDisplayRef.current = null;
    setFrame(null);
    setLoadedCount(0);
    setGridLoading(true);
    setError(null);
    setFlagsAvailable(true);
    post({
      type: 'load',
      size: shape,
      fov,
      ra,
      dec,
      band: bandRef.current,
    });

    let cancelled = false;
    let completed = 0;
    setStatus(`loading 0/${wanted.length} epochs`);

    const loadOne = async (epochIndex: number) => {
      const plane: FramePlane = await fetchFrame({
        ra,
        dec,
        fov,
        epoch: epochIndex,
        detector,
        shape,
        flags: true,
        variance: true,
      });
      if (cancelled || controller.signal.aborted) return;
      const firstFrame = loadedEpochsRef.current.size === 0;
      if (firstFrame) {
        // Which channels actually occur in this cutout: a 0.5 deg window only
        // covers ~2.5 channels, so the UI must not pretend all 17 are there.
        const counts = new Uint32Array(19);
        let covered = 0;
        for (let index = 0; index < plane.channel.length; index += 1) {
          const value = plane.channel[index];
          if (value >= 1 && value <= 17) {
            counts[value] += 1;
            covered += 1;
          }
        }
        const present: number[] = [];
        for (let value = 1; value <= 17; value += 1) {
          if (covered > 0 && counts[value] / covered >= 0.002) present.push(value);
        }
        setAvailableChannels(present);
        setPixelScaleArcsec(plane.pixelScaleArcsec || 6.15);
        setNativeShape(plane.nativeShape || FRAME_SIZE);
        // An unreadable FLAGS extension must surface as "unknown", never as
        // "everything is clean".
        if (!plane.hasFlags) setFlagsAvailable(false);
      }
      post(
        {
          type: 'frame-data',
          epochIndex,
          mjd: plane.mjd ?? 0,
          image: plane.image,
          flags: plane.flags,
          hasFlags: plane.hasFlags,
          variance: plane.variance,
          channel: firstFrame ? plane.channel : new Uint8Array(0),
          wavelength: firstFrame ? plane.wavelength : new Float32Array(0),
          lambdaShape: plane.lambdaShape,
          scaleArcsecPerPixel: (fov * 3600) / shape,
        },
        [
          plane.image.buffer,
          ...(plane.flags ? [plane.flags.buffer] : []),
          ...(plane.variance ? [plane.variance.buffer] : []),
          ...(firstFrame ? [plane.channel.buffer, plane.wavelength.buffer] : []),
        ],
      );
      loadedEpochsRef.current.add(epochIndex);
      setLoadedCount((count) => count + 1);
      completed += 1;
      if (firstFrame) setGridLoading(false);
      setStatus(completed < wanted.length ? `loading ${completed}/${wanted.length} epochs` : null);
    };

    const queue = [...wanted.map((epoch) => epoch.index)];
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length > 0) {
        const epochIndex = queue.shift();
        if (epochIndex === undefined) break;
        try {
          await loadOne(epochIndex);
        } catch (cause) {
          if (!cancelled) {
            setError(cause instanceof Error ? cause.message : 'frame download failed');
          }
        }
      }
    });
    void Promise.allSettled(workers);

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [coverage, detector, ra, dec, fov, shape, post]);

  /* -------------------------------------------------------------- render */
  const hasNeeded = useCallback((request: DisplayRequest): boolean => {
    const loaded = loadedEpochsRef.current;
    if (request.mode === 'raw') return loaded.has(request.epochIndex);
    if (request.mode === 'diff' || request.mode === 'compare') {
      return loaded.has(request.epochA) && loaded.has(request.epochB);
    }
    return loaded.size > 0;
  }, []);

  const render = useCallback(
    (request: DisplayRequest) => {
      if (!workerRef.current) return;
      if (!hasNeeded(request)) {
        pendingDisplayRef.current = request;
        return;
      }
      const id = ++requestIdRef.current;
      displayRef.current = id;
      setRendering(true);
      setError(null);
      post({ type: 'display', requestId: id, request });
    },
    [hasNeeded, post],
  );

  // Replay the last display request as soon as its epochs have arrived.
  useEffect(() => {
    const pending = pendingDisplayRef.current;
    if (!pending) return;
    if (!hasNeeded(pending)) return;
    pendingDisplayRef.current = null;
    render(pending);
  }, [ready, loadedCount, hasNeeded, render]);

  const requestResponse = useCallback(<T,>(message: WorkerRequest): Promise<T> => {
    if (!workerRef.current) return Promise.reject(new Error('worker unavailable'));
    const requestId = 800_000 + ++requestIdRef.current;
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        resolversRef.current.delete(requestId);
        reject(new Error('request timed out'));
      }, 10_000);
      resolversRef.current.set(requestId, {
        resolve: resolve as unknown as (value: never) => void,
        reject,
        timer,
      });
      post({ ...message, requestId } as WorkerRequest);
    });
  }, [post]);

  const probe = useCallback(
    (epochIndex: number, x: number, y: number) =>
      requestResponse<ProbeResponse>({ type: 'probe', requestId: 0, epochIndex, x, y }),
    [requestResponse],
  );

  const findCandidates = useCallback(
    (epochA: number, epochB: number, limit = 8) =>
      requestResponse<CandidatesResponse>({ type: 'candidates', requestId: 0, epochA, epochB, limit }).then(
        (response) => ({
          candidates: response.candidates,
          threshold: response.threshold,
          sigma: response.sigma,
        }),
      ),
    [requestResponse],
  );

  return {
    coverage,
    epochs,
    frame,
    ready,
    rendering,
    gridLoading,
    flagsAvailable,
    status,
    error,
    size: shape,
    loadedCount,
    availableChannels,
    pixelScaleArcsec,
    nativeShape,
    quickLook: detector === 0,
    render,
    probe,
    findCandidates,
  };
}
