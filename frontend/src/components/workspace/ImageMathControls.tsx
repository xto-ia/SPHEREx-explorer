import { Layers, SplitSquareHorizontal, SlidersHorizontal, Wand2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { FieldEpoch } from '../../lib/sky/field';
import type { StretchMode, WorkspaceMode } from '../../hooks/useUrlSync';

interface ImageMathControlsProps {
  mode: WorkspaceMode;
  coaddMethod: 'sum' | 'mean';
  epochA: number;
  epochB: number;
  epochs: FieldEpoch[];
  stretch: StretchMode;
  gain: number;
  showFlags: boolean;
  onModeChange: (mode: WorkspaceMode) => void;
  onCoaddMethodChange: (method: 'sum' | 'mean') => void;
  onEpochAChange: (value: number) => void;
  onEpochBChange: (value: number) => void;
  onStretchChange: (stretch: StretchMode) => void;
  onGainChange: (gain: number) => void;
  onShowFlagsChange: (value: boolean) => void;
}

const MODE_ICONS = {
  blink: Layers,
  coadd: SlidersHorizontal,
  diff: SplitSquareHorizontal,
} as const;

export default function ImageMathControls({
  mode,
  coaddMethod,
  epochA,
  epochB,
  epochs,
  stretch,
  gain,
  showFlags,
  onModeChange,
  onCoaddMethodChange,
  onEpochAChange,
  onEpochBChange,
  onStretchChange,
  onGainChange,
  onShowFlagsChange,
}: ImageMathControlsProps) {
  const { t } = useLanguage();

  const modes: Array<{ id: WorkspaceMode; label: string }> = [
    { id: 'blink', label: t.workspace.modeBlink },
    { id: 'coadd', label: t.workspace.modeCoadd },
    { id: 'diff', label: t.workspace.modeDiff },
  ];

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="arithmetic-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wand2 size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
          <h3 id="arithmetic-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
            {t.workspace.arithmeticTitle}
          </h3>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-px border border-line bg-line">
        {modes.map((item) => {
          const Icon = MODE_ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              aria-pressed={mode === item.id}
              className={[
                'flex flex-col items-center gap-1 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors',
                mode === item.id
                  ? 'bg-accent/10 text-accent'
                  : 'bg-canvas text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-200',
              ].join(' ')}
            >
              <Icon size={13} strokeWidth={1.4} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {mode === 'blink'
          ? t.workspace.arithmeticBlinkHint
          : mode === 'coadd'
            ? t.workspace.arithmeticCoaddHint
            : t.workspace.arithmeticDiffHint}
      </p>

      {mode === 'coadd' && (
        <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3">
          <span className="label-mono block">{t.workspace.coaddMethod}</span>
          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            {(['sum', 'mean'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onCoaddMethodChange(method)}
                aria-pressed={coaddMethod === method}
                className={[
                  'py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
                  coaddMethod === method
                    ? 'bg-accent/10 text-accent'
                    : 'bg-canvas text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                {method === 'sum' ? t.workspace.coaddSum : t.workspace.coaddAverage}
              </button>
            ))}
          </div>
          <p className="font-mono text-[9px] leading-relaxed text-zinc-600">
            {t.workspace.coaddGain.replace('{n}', String(epochs.length))}
          </p>
        </div>
      )}

      {mode === 'diff' && (
        <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="label-mono block">{t.workspace.diffA}</span>
              <select
                value={epochA}
                onChange={(event) => onEpochAChange(Number(event.target.value))}
                className="field !py-1.5 !text-[11px]"
              >
                {epochs.map((epoch, position) => (
                  <option key={epoch.index} value={epoch.index} className="bg-canvas">
                    E{position + 1} · {epoch.date}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="label-mono block">{t.workspace.diffB}</span>
              <select
                value={epochB}
                onChange={(event) => onEpochBChange(Number(event.target.value))}
                className="field !py-1.5 !text-[11px]"
              >
                {epochs.map((epoch, position) => (
                  <option key={epoch.index} value={epoch.index} className="bg-canvas">
                    E{position + 1} · {epoch.date}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="font-mono text-[9px] leading-relaxed text-zinc-600">
            {t.workspace.diffLegend}
          </p>
        </div>
      )}

      <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
        <div className="flex items-center justify-between">
          <span className="label-mono">{t.workspace.stretchLabel}</span>
          <span className="font-mono text-[9px] text-zinc-600">gain {gain.toFixed(1)}</span>
        </div>
        <div className="grid grid-cols-4 gap-px border border-line bg-line">
          {(['asinh', 'linear', 'sqrt', 'log'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onStretchChange(item)}
              aria-pressed={stretch === item}
              className={[
                'py-1 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors',
                stretch === item
                  ? 'bg-accent/10 text-accent'
                  : 'bg-canvas text-zinc-500 hover:text-zinc-200',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0.5}
          max={40}
          step={0.5}
          value={gain}
          onChange={(event) => onGainChange(Number(event.target.value))}
          className="w-full"
          aria-label={t.workspace.gain}
        />
        <button
          type="button"
          onClick={() => onShowFlagsChange(!showFlags)}
          aria-pressed={showFlags}
          className={[
            'flex w-full items-center justify-between gap-2 border px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors',
            showFlags
              ? 'border-warn/60 bg-warn/5 text-warn'
              : 'border-line text-zinc-500 hover:border-line-hover hover:text-zinc-200',
          ].join(' ')}
        >
          <span>{t.workspace.contaminationOverlay}</span>
          <span>{showFlags ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </section>
  );
}

