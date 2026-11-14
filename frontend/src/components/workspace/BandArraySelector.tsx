import { ChevronLeft, ChevronRight, Layers3, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ARRAY_COLORS,
  ARRAY_LABELS,
  ARRAY_RANGES,
  BANDS,
  BAND_COUNT,
  MOLECULAR_MARKERS,
  arrayLabel,
  bandAt,
  nearestBand,
} from '../../lib/sky/bands';
import type { ChannelType } from '../../hooks/useUrlSync';

interface BandArraySelectorProps {
  channel: { type: ChannelType; band: number; array: number };
  onSelectBand: (band: number) => void;
  onSelectArray: (array: number) => void;
  onSelectAll: () => void;
}

export default function BandArraySelector({
  channel,
  onSelectBand,
  onSelectArray,
  onSelectAll,
}: BandArraySelectorProps) {
  const { t } = useLanguage();
  const band = bandAt(channel.band);
  const isBands = channel.type === 'band';
  const isArray = channel.type === 'array';
  const isAll = channel.type === 'all';
  const activeArray = isArray ? channel.array : band.array;
  const [low, high] = ARRAY_RANGES[activeArray - 1];

  const gain =
    channel.type === 'band' ? 1 : channel.type === 'array' ? Math.sqrt(17) : Math.sqrt(102);

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="bands-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers3 size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
          <h3 id="bands-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
            {t.workspace.bandsTitle}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
          0.75–5.0 µm
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line">
        {[
          { id: 'band', label: t.workspace.channelBands },
          { id: 'array', label: t.workspace.channelArrays },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.id === 'band') onSelectBand(channel.type === 'band' ? channel.band : band.index);
              else onSelectArray(channel.type === 'array' ? channel.array : band.array);
            }}
            aria-pressed={tab.id === 'band' ? isBands : isArray}
            className={[
              'py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors',
              (tab.id === 'band' ? isBands : isArray)
                ? 'bg-accent/10 text-accent'
                : 'bg-canvas text-zinc-500 hover:text-zinc-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-2 font-mono text-[8px] leading-relaxed text-zinc-600">
        {t.workspace.bandStackHint}
      </p>

      {isBands && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2 border border-line bg-black/20 px-2 py-1.5">
            <div>
              <p className="font-mono text-[11px] text-zinc-100">
                {band.label} · {band.wavelength.toFixed(3)} µm
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-600">
                {t.common.band} {band.index}/{BAND_COUNT} · Δλ {band.width.toFixed(3)} µm
              </p>
            </div>
            <span
              aria-hidden="true"
              className="h-6 w-6 shrink-0 border"
              style={{ backgroundColor: `${band.color}22`, borderColor: band.color }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectBand(Math.max(1, band.index - 1))}
              className="grid h-7 w-7 shrink-0 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
              aria-label={t.workspace.previousBand}
            >
              <ChevronLeft size={12} aria-hidden="true" />
            </button>
            <input
              type="range"
              min={1}
              max={BAND_COUNT}
              step={1}
              value={band.index}
              onChange={(event) => onSelectBand(Number(event.target.value))}
              className="w-full"
              aria-label={t.common.band}
              style={{
                background: `linear-gradient(to right, ${ARRAY_COLORS.join(', ')})`,
              }}
            />
            <button
              type="button"
              onClick={() => onSelectBand(Math.min(BAND_COUNT, band.index + 1))}
              className="grid h-7 w-7 shrink-0 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
              aria-label={t.workspace.nextBand}
            >
              <ChevronRight size={12} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {BANDS.filter((item) => item.index % 8 === 0 || item.index === 1 || item.index === 102).map((item) => (
              <button
                key={item.index}
                type="button"
                onClick={() => onSelectBand(item.index)}
                className={`font-mono text-[8px] tracking-[0.04em] transition-colors ${
                  item.index === band.index ? 'text-accent' : 'text-zinc-600 hover:text-zinc-300'
                }`}
                title={`${item.label} · ${item.wavelength.toFixed(2)} µm`}
              >
                {item.index}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1">
            {ARRAY_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => onSelectArray(index + 1)}
                aria-pressed={band.array === index + 1}
                className={`border px-1 py-1 font-mono text-[8px] uppercase tracking-[0.08em] transition-colors ${
                  band.array === index + 1
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-line text-zinc-500 hover:text-zinc-200'
                }`}
                title={arrayLabel(index + 1)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isArray && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-zinc-300">
              {arrayLabel(channel.array)} · {t.workspace.arrayStack}
            </p>
            <span className="chip !py-0.5">{t.workspace.snrGain} {gain.toFixed(1)}×</span>
          </div>
          <ul className="space-y-px border border-line bg-line">
            {ARRAY_RANGES.map(([lo, hi], index) => {
              const arrayIndex = index + 1;
              const selected = channel.array === arrayIndex;
              return (
                <li key={arrayIndex}>
                  <button
                    type="button"
                    onClick={() => onSelectArray(arrayIndex)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors ${
                      selected ? 'bg-accent/[0.06]' : 'bg-canvas hover:bg-white/[0.02]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-4 w-1.5 shrink-0"
                      style={{ backgroundColor: ARRAY_COLORS[index] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] text-zinc-200">
                        {ARRAY_LABELS[index]} · {lo.toFixed(2)}–{hi.toFixed(2)} µm
                      </span>
                      <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                        17 bands · Δλ {(hi - lo).toFixed(2)} µm
                      </span>
                    </span>
                    <span className={`font-mono text-[9px] ${selected ? 'text-accent' : 'text-zinc-700'}`}>
                      {selected ? 'ACTIVE' : 'STACK'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={onSelectAll}
            aria-pressed={isAll}
            className={`w-full border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
              isAll
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-line text-zinc-500 hover:border-line-hover hover:text-zinc-200'
            }`}
          >
            {t.workspace.allArrays} · 102 {t.common.bands} · {t.workspace.snrGain} {Math.sqrt(102).toFixed(1)}×
          </button>
        </div>
      )}

      {isAll && (
        <div className="mt-3 space-y-2">
          <p className="font-mono text-[10px] text-zinc-300">
            {t.workspace.allArrays} · 102 {t.common.bands}
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-500">{t.workspace.allArraysHint}</p>
          <button
            type="button"
            onClick={() => onSelectArray(band.array)}
            className="w-full border border-line px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
          >
            {t.workspace.backToArrays}
          </button>
        </div>
      )}

      <div className="mt-3 space-y-1 border-t border-line/70 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles size={10} className="text-accent" aria-hidden="true" />
          <span className="label-mono">{t.workspace.molecularMarkers}</span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-600">
          {low.toFixed(2)}–{high.toFixed(2)} µm · {t.workspace.markersHint}
        </p>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
          {MOLECULAR_MARKERS.map((marker) => {
            const target = nearestBand(marker.wavelength);
            const inRange = marker.wavelength >= low && marker.wavelength <= high;
            return (
              <li key={marker.id}>
                <button
                  type="button"
                  onClick={() => onSelectBand(target.index)}
                  title={`${marker.note} → ${target.label} (${target.wavelength.toFixed(2)} µm)`}
                  className={`flex w-full items-center gap-1.5 py-0.5 text-left font-mono text-[9px] transition-colors ${
                    inRange ? 'text-zinc-300 hover:text-accent' : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: marker.color }} />
                  <span className="w-11 shrink-0" style={{ color: inRange ? marker.color : undefined }}>
                    {marker.label}
                  </span>
                  <span className="text-zinc-600">{marker.wavelength.toFixed(2)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-2 border-t border-line/70 pt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-700">
        {t.workspace.snrGain} {gain.toFixed(1)}× · {t.workspace.stackedBands.replace('{n}', channel.type === 'band' ? '1' : channel.type === 'array' ? '17' : '102')}
      </p>
    </section>
  );
}
