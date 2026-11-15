import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Columns2,
  Crosshair,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDec, formatRa } from '../../lib/coords';
import { formatArcsec, formatNumber, formatPixelScale } from '../../lib/format';
import { mjdToIso, skyToPixel, type FieldEpoch } from '../../lib/sky/field';
import type { NeossatObservation, OverlaySource } from '../../lib/api';
import type { SkyFrame } from '../../hooks/useSkyEngine';
import type { MoverCandidate, ProbeResponse } from '../../lib/sky/workerTypes';
import type { WorkspaceMode, WorkspaceState } from '../../hooks/useUrlSync';
import CompareSlider from './CompareSlider';

interface BlinkViewportProps {
  frame: SkyFrame | null;
  epochs: FieldEpoch[];
  size: number;
  ra: number;
  dec: number;
  fov: number;
  ready: boolean;
  rendering: boolean;
  status: string | null;
  error: string | null;
  mode: WorkspaceMode;
  epochIndex: number;
  epochA: number;
  epochB: number;
  bandLabel: string;
  /** Shown when the selected channel has no pixels in this cutout. */
  channelNotice?: string | null;
  targetName: string;
  overlays: WorkspaceState['overlays'];
  overlaySources: OverlaySource[];
  neossat: NeossatObservation[];
  selection: { x: number; y: number } | null;
  probe: ProbeResponse | null;
  playing: boolean;
  fps: number;
  pingPong: boolean;
  candidates: MoverCandidate[];
  focusMarker: MoverCandidate | null;
  showFlags: boolean;
  /** `epoch` is the frame under the cursor: in compare mode it is the A or B plane. */
  onProbe: (x: number, y: number, epoch: number) => void;
  onSelect: (x: number, y: number, epoch: number) => void;
  onTogglePlay: () => void;
  onStep: (direction: number) => void;
  onEpochChange: (epoch: number) => void;
  onFpsChange: (fps: number) => void;
  onPingPongChange: (value: boolean) => void;
  onToggleFlags: () => void;
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  shape: 'diamond' | 'circle',
  size = 4,
  filled = true,
) {
  ctx.strokeStyle = color;
  if (filled) ctx.fillStyle = color.replace('0.9', '0.14');
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (shape === 'diamond') {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
  } else {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  if (filled) ctx.fill();
  ctx.stroke();
}

const NEOSSAT_RGB = '244, 63, 94';

/**
 * Proper-motion arrows are a *time* baseline, not a sky length: SPHEREx samples
 * the sky at 6.15"/pixel, so ten years of a typical 7 mas/yr star is 0.07" —
 * a hundredth of a pixel. The true length is used whenever it reaches the
 * floor; slower stars keep a short stub so the direction stays readable, and
 * the panel documents that convention.
 */
const PM_BASELINE_YEARS = 10;
const PM_MIN_PX = 3;
const PM_MAX_PX = 48;


/** Vertices of a real CADC footprint, or a square from the catalogued size. */
function footprintOf(observation: NeossatObservation): Array<[number, number]> | null {
  if (observation.region && observation.region.length >= 3) return observation.region;
  if (!observation.fov) return null;
  const half = observation.fov / 2;
  const cosDec = Math.max(Math.cos((observation.dec * Math.PI) / 180), 1e-6);
  const offset = half / cosDec;
  return [
    [observation.ra - offset, observation.dec - half],
    [observation.ra + offset, observation.dec - half],
    [observation.ra + offset, observation.dec + half],
    [observation.ra - offset, observation.dec + half],
  ];
}

/**
 * One frame per distinct pointing.
 *
 * CADC lists every exposure separately, so a target observed for a whole night
 * yields dozens of near-identical polygons. Collapsing them onto a 0.01° grid
 * keeps the outlines legible without inventing a footprint: each remaining
 * polygon is a real `s_region` (or the catalogued `s_fov` square).
 */
function uniquePointings(observations: NeossatObservation[]): NeossatObservation[] {
  const seen = new Set<string>();
  const unique: NeossatObservation[] = [];
  observations.forEach((observation) => {
    const key = `${observation.name}:${observation.ra.toFixed(2)}:${observation.dec.toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(observation);
  });
  return unique;
}

function drawNeossatLayer(
  ctx: CanvasRenderingContext2D,
  observations: NeossatObservation[],
  centre: { ra: number; dec: number; fov: number },
  size: number,
  options: { footprints: boolean; tracks: boolean; labels: boolean },
) {
  if (observations.length === 0) return;
  ctx.save();
  ctx.lineWidth = 1;

  if (options.footprints) {
    // A 0.64° NEOSSat frame is larger than a typical SPHEREx field, so hundreds
    // of exposures stack into a solid block. Draw one outline per distinct
    // pointing (every outline is still a real CADC polygon) and fade the stroke
    // with density so the SPHEREx image stays readable.
    const pointings = uniquePointings(observations);
    const alpha = Math.min(0.18, 3 / pointings.length);
    ctx.strokeStyle = `rgba(${NEOSSAT_RGB}, ${alpha})`;
    pointings.forEach((observation) => {
      const vertices = footprintOf(observation);
      if (!vertices) return;
      ctx.beginPath();
      vertices.forEach(([vertexRa, vertexDec], vertex) => {
        const point = skyToPixel(vertexRa, vertexDec, centre, size);
        if (vertex === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    });
  }

  if (options.labels) {
    // One label per target, anchored on its most recent frame in this field.
    const latest = new Map<string, NeossatObservation>();
    observations.forEach((observation) => {
      const previous = latest.get(observation.name);
      if (!previous || (observation.tMin ?? 0) > (previous.tMin ?? 0)) {
        latest.set(observation.name, observation);
      }
    });
    if (latest.size <= 8) {
      ctx.fillStyle = 'rgba(251, 113, 133, 0.9)';
      ctx.textAlign = 'center';
      latest.forEach((observation) => {
        const anchor = skyToPixel(observation.ra, observation.dec, centre, size);
        ctx.fillText(
          `${observation.name.slice(0, 18)} ${observation.tMin ? mjdToIso(observation.tMin).slice(2) : ''}`.trim(),
          anchor.x,
          anchor.y - 4,
        );
      });
    }
  }

  if (options.tracks) {
    // Only objects the archive itself flags as moving get a path; joining the
    // pointing centres of a fixed target would invent motion.
    const groups = new Map<string, NeossatObservation[]>();
    observations.forEach((observation) => {
      if (observation.moving !== true || !observation.tMin) return;
      const bucket = groups.get(observation.name) ?? [];
      bucket.push(observation);
      groups.set(observation.name, bucket);
    });

    groups.forEach((bucket) => {
      if (bucket.length < 2) return;
      const ordered = [...bucket].sort((left, right) => (left.tMin ?? 0) - (right.tMin ?? 0));
      ctx.beginPath();
      ordered.forEach((observation, index) => {
        const point = skyToPixel(observation.ra, observation.dec, centre, size);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.95)';
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      const last = ordered[ordered.length - 1];
      const tip = skyToPixel(last.ra, last.dec, centre, size);
      ctx.fillStyle = 'rgba(244, 63, 94, 1)';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

export default function BlinkViewport({
  frame,
  epochs,
  size,
  ra,
  dec,
  fov,
  ready,
  rendering,
  status,
  error,
  mode,
  epochIndex,
  epochA,
  epochB,
  bandLabel,
  channelNotice,
  targetName,
  overlays,
  overlaySources,
  neossat,
  selection,
  probe,
  playing,
  fps,
  pingPong,
  candidates,
  focusMarker,
  showFlags,
  onProbe,
  onSelect,
  onTogglePlay,
  onStep,
  onEpochChange,
  onFpsChange,
  onPingPongChange,
  onToggleFlags,
}: BlinkViewportProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastProbeRef = useRef(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Divider position is view state, not science state: it stays out of the URL
  // so the link keeps only `mode`, `a` and `b`.
  const [split, setSplit] = useState(50);

  const epoch = epochs.find((item) => item.index === epochIndex) ?? epochs[0] ?? null;
  const epochAEpoch = epochs.find((item) => item.index === epochA) ?? null;
  const epochBEpoch = epochs.find((item) => item.index === epochB) ?? null;
  // `epochIndex` is a real archive epoch index; the timeline is a filtered
  // list, so the scrubber works on positions.
  const epochPosition = Math.max(
    epochs.findIndex((item) => item.index === epochIndex),
    0,
  );
  const epochAPosition = Math.max(
    epochs.findIndex((item) => item.index === epochA),
    0,
  );
  const epochBPosition = Math.max(
    epochs.findIndex((item) => item.index === epochB),
    0,
  );
  const scale = frame?.scaleArcsecPerPixel ?? (fov * 3600) / size;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.putImageData(new ImageData(new Uint8ClampedArray(frame.rgba), size, size), 0, 0);
  }, [frame, size]);

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    const centrePixel = (size - 1) / 2;
    const centre = { ra, dec, fov };

    if (overlays.grid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(82, 82, 91, 0.4)';
      ctx.setLineDash([3, 5]);
      for (let i = 1; i < 4; i += 1) {
        const offset = (i / 4) * size;
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(size, offset);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const half = (size / 2) * scale;
      const raEdge = (ra + half / 3600 / Math.max(Math.cos((dec * Math.PI) / 180), 0.05) + 360) % 360;
      ctx.fillStyle = 'rgba(212, 212, 216, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(`RA ${formatRa(raEdge)}`, 10, 13);
      ctx.textAlign = 'right';
      ctx.fillText(`DEC ${formatDec(dec + half / 3600)}`, size - 10, 13);
      ctx.fillText(`DEC ${formatDec(dec - half / 3600)}`, size - 10, size - 11);
      ctx.restore();
    }

    if (overlays.neossat) {
      drawNeossatLayer(ctx, neossat, centre, size, {
        footprints: true,
        tracks: overlays.tracks,
        labels: overlays.labels,
      });
    }

    for (const source of overlaySources) {
      const isGaia = source.catalog === 'gaia';
      if (isGaia && !overlays.gaia) continue;
      if (!isGaia && !overlays.wise) continue;
      const point = skyToPixel(source.ra, source.dec, centre, size);
      if (point.x < -6 || point.y < -6 || point.x > size + 6 || point.y > size + 6) continue;

      if (isGaia) {
        // A hollow diamond: small enough that a few thousand sources still read
        // as a star map, heavy enough to stay visible against the image.
        drawMarker(ctx, point.x, point.y, 'rgba(56, 189, 248, 0.9)', 'diamond', 2, false);
        const pmRa = source.pmRa ?? 0;
        const pmDec = source.pmDec ?? 0;
        const total = Math.hypot(pmRa, pmDec);
        if (total > 0) {
          const truePx = (total * PM_BASELINE_YEARS) / 1000 / Math.max(scale, 1e-6);
          const length = Math.min(PM_MAX_PX, Math.max(PM_MIN_PX, truePx));
          const vx = -(pmRa / total) * length;
          const vy = -(pmDec / total) * length;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.x + vx, point.y + vy);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (overlays.labels && (source.magnitude ?? 99) < 14) {
        ctx.fillStyle = 'rgba(212, 212, 216, 0.75)';
        ctx.textAlign = 'left';
        ctx.fillText(source.name.slice(0, 22), point.x + 8, point.y + 9);
      }
    }

    // Field centre reticle: the requested coordinates.
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centrePixel, centrePixel, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centrePixel - 22, centrePixel);
    ctx.lineTo(centrePixel - 8, centrePixel);
    ctx.moveTo(centrePixel + 8, centrePixel);
    ctx.lineTo(centrePixel + 22, centrePixel);
    ctx.moveTo(centrePixel, centrePixel - 22);
    ctx.lineTo(centrePixel, centrePixel - 8);
    ctx.moveTo(centrePixel, centrePixel + 8);
    ctx.lineTo(centrePixel, centrePixel + 22);
    ctx.stroke();

    if (selection) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 1)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(selection.x, selection.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    candidates.forEach((marker, index) => {
      const x = centrePixel - marker.xArcsec / scale;
      const y = centrePixel - marker.yArcsec / scale;
      if (x < 0 || y < 0 || x > size || y > size) return;
      const color = marker.sign > 0 ? 'rgba(244, 63, 94, 0.9)' : 'rgba(56, 189, 248, 0.9)';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(`C${index + 1}`, x + 9, y - 7);
    });

    if (focusMarker) {
      const x = centrePixel - focusMarker.xArcsec / scale;
      const y = centrePixel - focusMarker.yArcsec / scale;
      ctx.strokeStyle = 'rgba(251, 191, 36, 1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    const fovArcsec = fov * 3600;
    let barArcsec = fovArcsec * 0.1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(barArcsec)));
    barArcsec = Math.ceil(barArcsec / magnitude) * magnitude;
    const barPixels = barArcsec / scale;
    const barX = 14;
    const barY = size - 16;
    ctx.strokeStyle = 'rgba(228, 228, 231, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX, barY - 4);
    ctx.lineTo(barX, barY);
    ctx.lineTo(barX + barPixels, barY);
    ctx.lineTo(barX + barPixels, barY - 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(228, 228, 231, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(formatArcsec(barArcsec, 0), barX, barY - 11);

    ctx.textAlign = 'center';
    ctx.fillText('N ↑', size - 22, size - 54);
    ctx.fillText('← E', size - 22, size - 42);

    ctx.fillStyle = 'rgba(113, 113, 122, 0.75)';
    ctx.textAlign = 'left';
    ctx.fillText(`ICRS · ${formatPixelScale(scale)}`, 12, 30);
    // The compare bar below the frame prints both MJDs, so the canvas keeps a
    // single timestamp only when there is a single epoch on screen.
    if (epoch && mode !== 'compare') {
      ctx.textAlign = 'right';
      ctx.fillText(`MJD ${epoch.mjd.toFixed(2)}`, size - 12, size - 30);
    }
  }, [
    size,
    ra,
    dec,
    fov,
    scale,
    overlays,
    overlaySources,
    neossat,
    selection,
    candidates,
    focusMarker,
    epoch,
    mode,
  ]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const pixelFromEvent = useCallback(
    (event: { clientX: number; clientY: number; currentTarget: HTMLCanvasElement }) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((event.clientX - rect.left) / rect.width) * size,
        y: ((event.clientY - rect.top) / rect.height) * size,
      };
    },
    [size],
  );

  const handlePointer = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const now = performance.now();
      if (now - lastProbeRef.current < 70) return;
      lastProbeRef.current = now;
      const point = pixelFromEvent(event);
      if (point) onProbe(point.x, point.y, epochIndex);
    },
    [onProbe, pixelFromEvent, epochIndex],
  );

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLCanvasElement>) => {
      const point = pixelFromEvent(event);
      if (point) onSelect(point.x, point.y, epochIndex);
    },
    [onSelect, pixelFromEvent, epochIndex],
  );

  const downloadFrame = useCallback(() => {
    if (!frame) return;
    const output = document.createElement('canvas');
    output.width = size;
    output.height = size;
    const context = output.getContext('2d');
    if (!context) return;

    // Compose from the worker's real planes instead of the DOM canvases so the
    // export works in every mode, including the clipped compare view.
    const composite = new Uint8ClampedArray(frame.rgba);
    if (mode === 'compare' && frame.rgbaB) {
      const cut = Math.round((split / 100) * size);
      for (let y = 0; y < size; y += 1) {
        for (let x = cut; x < size; x += 1) {
          const offset = (y * size + x) * 4;
          composite[offset] = frame.rgbaB[offset];
          composite[offset + 1] = frame.rgbaB[offset + 1];
          composite[offset + 2] = frame.rgbaB[offset + 2];
          composite[offset + 3] = frame.rgbaB[offset + 3];
        }
      }
    }
    context.putImageData(new ImageData(composite, size, size), 0, 0);
    if (overlayRef.current) context.drawImage(overlayRef.current, 0, 0);

    const suffix =
      mode === 'compare'
        ? `a${epochAPosition + 1}-b${epochBPosition + 1}`
        : `e${epochPosition + 1}`;
    const link = document.createElement('a');
    link.download = `spherex-${targetName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${suffix}.png`;
    link.href = output.toDataURL('image/png');
    link.click();
  }, [frame, mode, size, split, targetName, epochPosition, epochAPosition, epochBPosition]);

  const toggleFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      // fullscreen can be rejected without a user gesture
    }
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const epochCount = epochs.length;

  return (
    <section
      ref={containerRef}
      className={`bg-canvas/90 ${fullscreen ? 'flex h-screen flex-col overflow-auto' : ''}`}
      aria-labelledby="viewport-title"
    >
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crosshair size={12} className="text-accent" aria-hidden="true" />
            <h2
              id="viewport-title"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-200"
            >
              {t.workspace.viewportTitle}
            </h2>
          </div>
          {/*
            Only calm labels belong in this wrapping row: a chip that changes
            width while the epochs blink re-wraps its neighbours and drags the
            whole panel with it. The epoch counter therefore keeps a constant
            three-character footprint (`—/—` while the archive is loading).
          */}
          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            <span className="chip normal-case tracking-[0.06em]">{bandLabel}</span>
            {mode === 'compare' ? (
              <span className="chip">
                E{epochAPosition + 1} │ E{epochBPosition + 1}
              </span>
            ) : mode === 'diff' ? (
              <span className="chip">
                E{epochAPosition + 1} → E{epochBPosition + 1}
              </span>
            ) : mode === 'coadd' ? (
              <span className="chip">
                {t.workspace.modeCoadd} · {epochCount} {t.common.epochs}
              </span>
            ) : (
              <span className="chip">
                {t.common.epoch} {epochCount > 0 ? `${epochPosition + 1}/${epochCount}` : '—/—'}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleFlags}
              className={`chip transition-colors ${showFlags ? 'border-warn/60 text-warn' : 'hover:border-line-hover hover:text-zinc-200'}`}
              aria-pressed={showFlags}
              title={t.workspace.contaminationOverlay}
            >
              {t.workspace.flagsToggle}
            </button>
            <button
              type="button"
              onClick={downloadFrame}
              className="chip transition-colors hover:border-line-hover hover:text-zinc-200"
              title={t.workspace.downloadFrame}
              aria-label={t.workspace.downloadFrame}
            >
              <Download size={9} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="chip transition-colors hover:border-line-hover hover:text-zinc-200"
              title={fullscreen ? t.workspace.exitFullscreen : t.workspace.fullscreen}
              aria-label={fullscreen ? t.workspace.exitFullscreen : t.workspace.fullscreen}
            >
              {fullscreen ? <Minimize2 size={9} aria-hidden="true" /> : <Maximize2 size={9} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/*
          Per-frame readout on its own fixed-height line.
          The render status, the timing and the p99 change with every blinked
          frame and have wildly different text widths. Inside the wrapping chip
          row above they re-flowed the buttons and, on phone-width headers, added
          or dropped a whole wrapped line, which pushed the image (and everything
          below it) up and down at playback speed. A reserved one-line slot keeps
          the panel geometry identical no matter what this line says.
        */}
        <div className="mt-1.5 flex h-4 items-center gap-1.5 overflow-hidden font-mono text-[9px] uppercase leading-none tracking-[0.14em] text-zinc-500">
          {rendering || status ? (
            <>
              <Loader2 size={9} className="shrink-0 animate-spin text-accent" aria-hidden="true" />
              <span className="truncate text-accent">{status ?? t.workspace.rendering}</span>
            </>
          ) : frame ? (
            <span className="truncate">
              {frame.computeMs} ms · {formatNumber(frame.stats.p99, 2)} p99
            </span>
          ) : (
            <span className="truncate">{t.workspace.aligningArrays}</span>
          )}
        </div>
      </div>

      <div
        className={`relative mx-auto overflow-hidden bg-[#04060a] ${fullscreen ? 'aspect-square' : 'aspect-square w-full'}`}
        style={
          fullscreen
            ? { height: 'calc(100vh - 7rem)', width: 'calc(100vh - 7rem)', maxWidth: '100%' }
            : undefined
        }
      >
        {mode === 'compare' ? (
          <CompareSlider
            rgbaA={frame?.rgba ?? null}
            rgbaB={frame?.rgbaB ?? null}
            size={size}
            split={split}
            onSplitChange={setSplit}
            onProbe={(x, y, side) => onProbe(x, y, side === 'a' ? epochA : epochB)}
            onSelect={(x, y, side) => onSelect(x, y, side === 'a' ? epochA : epochB)}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            onPointerMove={handlePointer}
            onPointerDown={handleClick}
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            aria-label={`${t.workspace.viewportTitle} · ${targetName} · ${epoch?.label ?? ''}`}
            role="img"
          />
        )}
        <canvas
          ref={overlayRef}
          width={size}
          height={size}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {mode === 'compare' && frame && !frame.rgbaB && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 border border-warn/50 bg-canvas/85 px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-warn">
            {t.workspace.compareMissingSide}
          </div>
        )}

        {channelNotice && (
          <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 border border-amber-500/40 bg-canvas/90 px-3 py-2 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-amber-300">
            {channelNotice}
          </div>
        )}

        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center bg-canvas/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                {status ?? t.workspace.aligningArrays}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-4 grid place-items-center border border-rose-500/40 bg-rose-500/5 p-4 text-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-300">{error}</p>
            </div>
          </div>
        )}

        {probe && (
          <div className="pointer-events-none absolute left-3 top-3 hidden max-w-[15rem] border border-line/80 bg-canvas/80 px-2 py-1.5 font-mono text-[9px] leading-relaxed text-zinc-400 backdrop-blur-sm sm:block">
            <div className="text-zinc-200">
              {formatRa(probe.ra)} · {formatDec(probe.dec)}
            </div>
            <div>
              {t.workspace.pixelValue}: {Number.isFinite(probe.value) ? `${formatNumber(probe.value, 3)} MJy/sr` : '—'}
            </div>
            <div>
              {t.workspace.flagsShort}: 0x{probe.flags.toString(16).toUpperCase()}
            </div>
          </div>
        )}

        {mode === 'diff' && (
          <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 border border-line/70 bg-canvas/80 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-500 backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#f43f5e]" />
              +Δ
            </span>
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#38bdf8]" />
              −Δ
            </span>
            <span className="hidden sm:inline">{t.workspace.diffLegend}</span>
          </div>
        )}
      </div>

      {mode === 'blink' ? (
        <>
          <div className="space-y-3 border-t border-line p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onTogglePlay} className="btn-primary !px-3 !py-2">
                {playing ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                {playing ? t.common.pause : t.common.play}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onStep(-1)}
                  className="grid h-8 w-8 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
                  aria-label={t.workspace.stepBack}
                >
                  <SkipBack size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onStep(1)}
                  className="grid h-8 w-8 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
                  aria-label={t.workspace.stepForward}
                >
                  <SkipForward size={12} aria-hidden="true" />
                </button>
              </div>

              <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(epochCount - 1, 0)}
                  step={1}
                  value={epochPosition}
                  onChange={(event) => {
                    const position = Number(event.target.value);
                    onEpochChange(epochs[position]?.index ?? epochIndex);
                  }}
                  className="w-full"
                  aria-label={t.workspace.epochScrubber}
                />
                <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                  {epochs.map((item, position) => (
                    <button
                      key={item.index}
                      type="button"
                      onClick={() => onEpochChange(item.index)}
                      className={`transition-colors ${item.index === epochIndex ? 'text-accent' : 'hover:text-zinc-300'}`}
                    >
                      E{position + 1}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPingPongChange(!pingPong)}
                className={`chip !py-1.5 transition-colors ${pingPong ? 'border-accent/60 text-accent' : 'hover:border-line-hover hover:text-zinc-200'}`}
                aria-pressed={pingPong}
                title={t.workspace.pingPong}
              >
                <Repeat size={10} aria-hidden="true" />
                {t.workspace.pingPongShort}
              </button>

              <label className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                {t.workspace.fps}
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={fps}
                  onChange={(event) => onFpsChange(Number(event.target.value))}
                  className="w-16"
                />
                <span className="w-6 text-right text-zinc-300">{fps}</span>
              </label>
            </div>

            {/*
              The epoch label and exposure change with every blinked frame, so
              the middle cell may never wrap onto a second line: it truncates
              instead, keeping the row (and the timeline below it) still.
            */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-line/70 pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
              <span className="shrink-0">
                {t.workspace.mode}: {t.workspace.modeBlink}
              </span>
              <span className="min-w-0 flex-1 truncate text-right">
                {epoch?.label ?? '—'}
                {epoch?.exposure ? ` · ${t.workspace.exposure} ${epoch.exposure.toFixed(0)}s` : ''}
              </span>
              <span className="hidden shrink-0 sm:inline">{t.workspace.keyboardHint}</span>
            </div>
          </div>

          <div className="border-t border-line p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="label-mono">{t.workspace.epochTimeline}</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                MJD
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 sm:grid-cols-6">
              {epochs.map((item) => {
                const active = item.index === epochIndex;
                return (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => onEpochChange(item.index)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 border px-1 py-1.5 transition-colors ${
                      active
                        ? 'border-accent/60 bg-accent/[0.06]'
                        : 'border-line bg-canvas hover:border-line-hover'
                    }`}
                    title={`${item.label} · MJD ${item.mjd.toFixed(2)}`}
                  >
                    <span className={`font-mono text-[8px] uppercase tracking-[0.06em] ${active ? 'text-accent' : 'text-zinc-400'}`}>
                      E{item.index + 1}
                    </span>
                    <span className="font-mono text-[7px] text-zinc-600">{item.date.slice(5)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : mode === 'compare' ? (
        <div className="border-t border-line p-3 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
            <div className="min-w-0 font-mono text-[9px] uppercase tracking-[0.1em]">
              <p className="flex items-center gap-1.5 text-zinc-300">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                {t.workspace.compareBefore}
              </p>
              <p className="mt-1 truncate text-zinc-400">{epochAEpoch?.label ?? `E${epochAPosition + 1}`}</p>
              <p className="truncate text-zinc-600">
                MJD {epochAEpoch ? epochAEpoch.mjd.toFixed(3) : '—'}
                {epochAEpoch?.exposure ? ` · ${epochAEpoch.exposure.toFixed(0)}s` : ''}
              </p>
            </div>

            <div className="grid place-items-center gap-1 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
              <Columns2 size={12} aria-hidden="true" />
              <span className="tabular-nums">{Math.round(split)}%</span>
            </div>

            <div className="min-w-0 text-right font-mono text-[9px] uppercase tracking-[0.1em]">
              <p className="flex items-center justify-end gap-1.5 text-zinc-300">
                {t.workspace.compareAfter}
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-[#38bdf8]" />
              </p>
              <p className="mt-1 truncate text-zinc-400">{epochBEpoch?.label ?? `E${epochBPosition + 1}`}</p>
              <p className="truncate text-zinc-600">
                MJD {epochBEpoch ? epochBEpoch.mjd.toFixed(3) : '—'}
                {epochBEpoch?.exposure ? ` · ${epochBEpoch.exposure.toFixed(0)}s` : ''}
              </p>
            </div>
          </div>

          {epochA === epochB && (
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-warn">
              {t.workspace.compareSameEpoch}
            </p>
          )}

          <p className="mt-2 border-t border-line/70 pt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            {t.workspace.compareDragHint}
          </p>
        </div>
      ) : (
        <div className="border-t border-line p-3 sm:p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
            {t.workspace.playbackBlinkOnly}
          </p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-700">
            {t.workspace.mode}: {mode === 'coadd' ? t.workspace.modeCoadd : t.workspace.modeDiff} ·{' '}
            {epochCount} {t.common.epochs}
          </p>
        </div>
      )}
    </section>
  );
}
