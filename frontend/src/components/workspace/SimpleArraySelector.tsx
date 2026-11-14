import { Layers3, Eye } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ARRAY_COLORS,
  ARRAY_LABELS,
  BAND_RANGES,
  arrayLabel,
  bandAt,
} from '../../lib/sky/bands';
import type { ChannelType } from '../../hooks/useUrlSync';

interface SimpleArraySelectorProps {
  channel: { type: ChannelType; band: number; array: number };
  onSelectArray: (array: number) => void;
  onSelectAll: () => void;
}

/**
 * Beginner surface: one real detector plane at a time, no channel machinery.
 *
 * A Level-2 frame already contains all 17 channels of its band (one wavelength
 * per row), so this is a real image, not a synthetic broadband composite.
 */
export default function SimpleArraySelector({
  channel,
  onSelectArray,
  onSelectAll,
}: SimpleArraySelectorProps) {
  const { t } = useLanguage();
  const detector =
    channel.type === 'array' ? channel.array : channel.type === 'band' ? bandAt(channel.band).detector : 3;

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="simple-arrays-title">
      <div className="flex items-center gap-2">
        <Layers3 size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
        <h3 id="simple-arrays-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
          {t.workspace.simpleArraysTitle}
        </h3>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{t.workspace.simpleArraysBody}</p>

      <div className="mt-3 grid grid-cols-2 gap-1">
        {BAND_RANGES.map(([low, high], index) => {
          const arrayIndex = index + 1;
          const selected = channel.type !== 'all' && detector === arrayIndex;
          return (
            <button
              key={arrayIndex}
              type="button"
              onClick={() => onSelectArray(arrayIndex)}
              aria-pressed={selected}
              className={`border px-2 py-2 text-left transition-colors ${
                selected
                  ? 'border-accent/60 bg-accent/[0.08]'
                  : 'border-line bg-canvas hover:border-line-hover'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0"
                  style={{ backgroundColor: ARRAY_COLORS[index] }}
                />
                <span className={`font-mono text-[11px] ${selected ? 'text-accent' : 'text-zinc-200'}`}>
                  {ARRAY_LABELS[index]}
                </span>
              </span>
              <span className="mt-0.5 block font-mono text-[8px] tracking-[0.04em] text-zinc-500">
                {low.toFixed(3)}–{high.toFixed(3)} µm
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
        {arrayLabel(detector)} · {t.workspace.simpleArraysActive}
      </p>

      <button
        type="button"
        onClick={onSelectAll}
        aria-pressed={channel.type === 'all'}
        className={`mt-3 flex w-full items-center justify-between gap-2 border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
          channel.type === 'all'
            ? 'border-accent/60 bg-accent/10 text-accent'
            : 'border-line text-zinc-400 hover:border-line-hover hover:text-zinc-200'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Eye size={11} aria-hidden="true" />
          {t.workspace.quickLookShort}
        </span>
        <span className="text-[8px] text-zinc-600">{t.workspace.quickLookTag}</span>
      </button>
      <p className="mt-1 font-mono text-[8px] leading-relaxed text-zinc-600">
        {t.workspace.quickLookHint}
      </p>
    </section>
  );
}
