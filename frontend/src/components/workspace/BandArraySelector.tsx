import { ChevronLeft, ChevronRight, Layers3, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ARRAY_COLORS,
  ARRAY_LABELS,
  BAND_RANGES,
  MOLECULAR_MARKERS,
  arrayLabel,
  bandAt,
  bandIndex,
  bandsForArray,
  nearestBand,
} from '../../lib/sky/bands';
import type { ChannelType } from '../../hooks/useUrlSync';

interface BandArraySelectorProps {
  channel: { type: ChannelType; band: number; array: number };
  /** Channels (1-17) that actually occur in the current cutout. */
  availableChannels: number[];
  onSelectBand: (band: number) => void;
  onSelectArray: (array: number) => void;
  onSelectAll: () => void;
  /** Widen the field so the whole detector (and all 17 channels) is inside. */
  onWidenField: () => void;
}

export default function BandArraySelector({
  channel,
  availableChannels,
  onSelectBand,
  onSelectArray,
  onSelectAll,
  onWidenField,
}: BandArraySelectorProps) {
  const { t } = useLanguage();
  const activeBand = bandAt(channel.band);
  const isChannels = channel.type === 'band';
  const isArray = channel.type === 'array';
  const isAll = channel.type === 'all';
  const detector =
    channel.type === 'array' ? channel.array : activeBand.detector;
  const [low, high] = BAND_RANGES[detector - 1];
  const arrayBands = bandsForArray(detector);

  const channelAvailable = (subchan: number) =>
    availableChannels.length === 0 || availableChannels.includes(subchan);
  const selectedAvailable = channelAvailable(activeBand.subchan);

  const selectChannel = (subchan: number) =>
    onSelectBand(bandIndex(detector, subchan));

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
          {t.workspace.spectralImage}
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
              if (tab.id === 'band') {
                if (!isChannels) selectChannel(activeBand.subchan);
              } else {
                onSelectArray(detector);
              }
            }}
            aria-pressed={tab.id === 'band' ? isChannels : isArray || isAll}
            className={[
              'py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors',
              (tab.id === 'band' ? isChannels : isArray || isAll)
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

      {isChannels && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2 border border-line bg-black/20 px-2 py-1.5">
            <div>
              <p className="font-mono text-[11px] text-zinc-100">
                {activeBand.label} · {activeBand.wavelength.toFixed(3)} µm
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-600">
                R {activeBand.R} · Δλ {activeBand.width.toFixed(3)} µm · {activeBand.wlMin.toFixed(3)}–{activeBand.wlMax.toFixed(3)}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="h-6 w-6 shrink-0 border"
              style={{ backgroundColor: `${ARRAY_COLORS[detector - 1]}22`, borderColor: ARRAY_COLORS[detector - 1] }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectChannel(Math.max(1, activeBand.subchan - 1))}
              className="grid h-7 w-7 shrink-0 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
              aria-label={t.workspace.previousBand}
            >
              <ChevronLeft size={12} aria-hidden="true" />
            </button>
            <input
              type="range"
              min={1}
              max={17}
              step={1}
              value={activeBand.subchan}
              onChange={(event) => selectChannel(Number(event.target.value))}
              className="w-full"
              aria-label={t.common.band}
              style={{
                background: `linear-gradient(to right, ${ARRAY_COLORS[detector - 1]}33, ${ARRAY_COLORS[detector - 1]})`,
              }}
            />
            <button
              type="button"
              onClick={() => selectChannel(Math.min(17, activeBand.subchan + 1))}
              className="grid h-7 w-7 shrink-0 place-items-center border border-line text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
              aria-label={t.workspace.nextBand}
            >
              <ChevronRight size={12} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-9 gap-1">
            {arrayBands.map((item) => {
              const available = channelAvailable(item.subchan);
              const selected = item.subchan === activeBand.subchan;
              return (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => selectChannel(item.subchan)}
                  title={`${item.label} · ${item.wavelength.toFixed(3)} µm${available ? '' : ` · ${t.workspace.channelOutsideCutout}`}`}
                  className={[
                    'border px-0.5 py-1 font-mono text-[8px] transition-colors',
                    selected
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : available
                        ? 'border-line text-zinc-400 hover:text-zinc-100'
                        : 'border-line/60 text-zinc-700 line-through',
                  ].join(' ')}
                >
                  {item.subchan}
                </button>
              );
            })}
          </div>

          {!selectedAvailable && (
            <div className="space-y-1.5 border border-amber-500/30 bg-amber-500/[0.04] px-2 py-1.5">
              <p className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.08em] text-amber-300/90">
                {t.workspace.channelOutsideCutoutHint}
              </p>
              <button
                type="button"
                onClick={onWidenField}
                className="w-full border border-amber-500/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-amber-200 transition-colors hover:bg-amber-500/10"
              >
                {t.workspace.widenToDetector}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {arrayBands
              .filter((item) => item.subchan % 4 === 1 || item.subchan === 17)
              .map((item) => (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => selectChannel(item.subchan)}
                  className={`font-mono text-[8px] tracking-[0.04em] transition-colors ${
                    item.subchan === activeBand.subchan ? 'text-accent' : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                  title={`${item.label} · ${item.wavelength.toFixed(3)} µm`}
                >
                  {item.wavelength.toFixed(2)}
                </button>
              ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectArray(detector)}
            className="w-full border border-line px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100"
          >
            {t.workspace.showWholeArray}
          </button>
        </div>
      )}

      {isArray && (
        <div className="mt-3 space-y-2">
          <p className="font-mono text-[10px] text-zinc-300">
            {arrayLabel(channel.array)} · {t.workspace.arrayStack}
          </p>
          <ul className="space-y-px border border-line bg-line">
            {BAND_RANGES.map(([lo, hi], index) => {
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
                        {ARRAY_LABELS[index]} · {lo.toFixed(3)}–{hi.toFixed(3)} µm
                      </span>
                      <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                        {t.workspace.seventeenChannels}
                      </span>
                    </span>
                    <span className={`font-mono text-[9px] ${selected ? 'text-accent' : 'text-zinc-700'}`}>
                      {selected ? t.workspace.activeArray : t.workspace.spectralImageShort}
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
            {t.workspace.quickLook}
          </button>
          <p className="font-mono text-[8px] leading-relaxed text-zinc-600">
            {t.workspace.quickLookHint}
          </p>
        </div>
      )}

      {isAll && (
        <div className="mt-3 space-y-2">
          <p className="font-mono text-[10px] text-zinc-300">{t.workspace.quickLook}</p>
          <p className="text-[11px] leading-relaxed text-zinc-500">{t.workspace.allArraysHint}</p>
          <button
            type="button"
            onClick={() => onSelectArray(activeBand.detector)}
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
          {low.toFixed(3)}–{high.toFixed(3)} µm · {t.workspace.markersHint}
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
                  title={`${marker.note} → ${target.label} (${target.wavelength.toFixed(3)} µm)`}
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
        {isChannels
          ? t.workspace.stackedBands.replace('{n}', '1')
          : isArray
            ? t.workspace.stackedBands.replace('{n}', '17')
            : t.workspace.stackedBands.replace('{n}', '6')}
      </p>
    </section>
  );
}
