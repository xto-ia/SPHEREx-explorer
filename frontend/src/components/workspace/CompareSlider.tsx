import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { GripVertical } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { clamp } from '../../lib/format';

export type CompareSide = 'a' | 'b';

interface CompareSliderProps {
  /** Real stretched plane of the left (before) epoch. */
  rgbaA: Uint8ClampedArray | null;
  /** Real stretched plane of the right (after) epoch. */
  rgbaB: Uint8ClampedArray | null;
  size: number;
  /** Position of the divider in percent, 0 = all B, 100 = all A. */
  split: number;
  onSplitChange: (value: number) => void;
  onProbe: (x: number, y: number, side: CompareSide) => void;
  onSelect: (x: number, y: number, side: CompareSide) => void;
}

const clampSplit = (value: number) => clamp(value, 0, 100);

function paint(canvas: HTMLCanvasElement | null, rgba: Uint8ClampedArray | null, size: number) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  if (!rgba || rgba.length !== size * size * 4) {
    context.clearRect(0, 0, size, size);
    return;
  }
  context.putImageData(new ImageData(new Uint8ClampedArray(rgba), size, size), 0, 0);
}

/**
 * Before/after wipe over two real epochs.
 *
 * Both planes are already resampled by the backend onto the same 480 × 480
 * sky grid, so the divider only has to clip the upper canvas: no alignment,
 * no resampling and no invention. The lower canvas keeps the whole frame so
 * the two halves stay pixel-identical across the seam.
 */
export default function CompareSlider({
  rgbaA,
  rgbaB,
  size,
  split,
  onSplitChange,
  onProbe,
  onSelect,
}: CompareSliderProps) {
  const { t } = useLanguage();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasARef = useRef<HTMLCanvasElement | null>(null);
  const canvasBRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef(false);
  const lastProbeRef = useRef(0);

  useEffect(() => {
    paint(canvasARef.current, rgbaA, size);
  }, [rgbaA, size]);

  useEffect(() => {
    paint(canvasBRef.current, rgbaB, size);
  }, [rgbaB, size]);

  const splitFromClientX = useCallback((clientX: number): number => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return split;
    return clampSplit(((clientX - rect.left) / rect.width) * 100);
  }, [split]);

  const pointFromEvent = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((event.clientX - rect.left) / rect.width) * size,
        y: ((event.clientY - rect.top) / rect.height) * size,
      };
    },
    [size],
  );

  const sideAt = useCallback(
    (x: number): CompareSide => (x < (split / 100) * size ? 'a' : 'b'),
    [split, size],
  );

  /* ------------------------------------------------------------- pointer */
  const handleMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) {
        onSplitChange(splitFromClientX(event.clientX));
        return;
      }
      const now = performance.now();
      if (now - lastProbeRef.current < 70) return;
      lastProbeRef.current = now;
      const point = pointFromEvent(event);
      if (point) onProbe(point.x, point.y, sideAt(point.x));
    },
    [onProbe, onSplitChange, pointFromEvent, sideAt, splitFromClientX],
  );

  const handleDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const point = pointFromEvent(event);
      if (point) onSelect(point.x, point.y, sideAt(point.x));
    },
    [onSelect, pointFromEvent, sideAt],
  );

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      onSplitChange(splitFromClientX(event.clientX));
    },
    [onSplitChange, splitFromClientX],
  );

  const moveDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      event.preventDefault();
      onSplitChange(splitFromClientX(event.clientX));
    },
    [onSplitChange, splitFromClientX],
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  /* ------------------------------------------------------------ keyboard */
  // The whole workspace listens for ←/→ to step epochs; in this mode the
  // divider owns those keys, so the nudge works without focusing the handle.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onSplitChange(clampSplit(split - step));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onSplitChange(clampSplit(split + step));
      } else if (event.key === 'Home') {
        event.preventDefault();
        onSplitChange(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        onSplitChange(100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSplitChange, split]);

  return (
    <div ref={frameRef} className="absolute inset-0">
      <canvas
        ref={canvasARef}
        width={size}
        height={size}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      <canvas
        ref={canvasBRef}
        width={size}
        height={size}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        aria-hidden="true"
      />

      {/*
        One interaction layer for the whole frame: hovering probes the epoch
        under the cursor, clicking extracts that epoch's spectrum.
      */}
      <div
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerMove={handleMove}
        onPointerDown={handleDown}
      />

      {/* Divider: 28 px grab strip, 1 px hairline, square grip. */}
      <div
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        aria-label={t.workspace.splitPosition}
        className="absolute inset-y-0 z-10 w-7 -translate-x-1/2 cursor-ew-resize touch-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent/70"
        style={{ left: `${split}%` }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onSplitChange(50)}
        title={t.workspace.compareDragHint}
      >
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-accent/80" />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 grid h-16 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center border border-accent/70 bg-canvas/90 text-accent shadow-[0_0_18px_rgba(0,0,0,0.65)]"
        >
          <GripVertical size={13} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
