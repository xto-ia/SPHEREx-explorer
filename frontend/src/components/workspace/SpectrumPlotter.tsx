import { ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ARRAY_COLORS, ARRAY_LABELS, bandAt } from '../../lib/sky/bands';
import type { SpectrumData } from '../../lib/api';

interface SpectrumPlotterProps {
  spectrum: SpectrumData | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  selectedBand: number;
  onSelectBand: (band: number) => void;
  /** Beginner surface: plain-language summary, explicit build step. */
  simple?: boolean;
  /** A source is selected but the multi-visit scan has not been started. */
  pending?: boolean;
  onBuild?: () => void;
}

const PADDING = { left: 52, right: 16, top: 14, bottom: 24 };
const WIDTH = 960;
const HEIGHT = 240;

function compact(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (magnitude >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  if (magnitude >= 10) return value.toFixed(0);
  if (magnitude >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

export default function SpectrumPlotter({
  spectrum,
  loading,
  error,
  open,
  onToggle,
  onClose,
  selectedBand,
  onSelectBand,
  simple = false,
  pending = false,
  onBuild,
}: SpectrumPlotterProps) {
  const { t } = useLanguage();

  const measured = (spectrum?.points ?? []).filter(
    (point) =>
      point.wavelength !== null &&
      point.flux !== null &&
      Number.isFinite(point.flux) &&
      Number.isFinite(point.wavelength),
  );

  const wavelengths = measured.map((point) => point.wavelength as number);
  const low = measured.length ? Math.min(...wavelengths) : 0.743;
  const high = measured.length ? Math.max(...wavelengths) : 5.01;

  const fluxValues = measured.flatMap((point) => {
    const flux = point.flux as number;
    const error = Number.isFinite(point.fluxErr ?? Number.NaN) ? (point.fluxErr as number) : 0;
    return [flux - Math.abs(error), flux + Math.abs(error)];
  });
  const maxFlux = fluxValues.length ? Math.max(...fluxValues) : 1;
  const minFlux = fluxValues.length ? Math.min(...fluxValues) : 0;
  const span = Math.max(maxFlux - minFlux, 1e-9);
  const yMax = maxFlux + span * 0.08;
  const yMin = minFlux - span * 0.08;

  const xFor = (wavelength: number) =>
    PADDING.left +
    ((wavelength - low) / Math.max(high - low, 1e-9)) * (WIDTH - PADDING.left - PADDING.right);
  const yFor = (flux: number) =>
    HEIGHT - PADDING.bottom - ((flux - yMin) / Math.max(yMax - yMin, 1e-9)) * (HEIGHT - PADDING.top - PADDING.bottom);

  const selected = bandAt(selectedBand);
  const selectedPoints = measured.filter((point) => point.channel === selectedBand);
  const selectedFlux = selectedPoints.length
    ? selectedPoints.map((point) => point.flux as number).sort((a, b) => a - b)[
        Math.floor(selectedPoints.length / 2)
      ]
    : null;
  const selectedX = xFor(selected.wavelength);

  const downloadCsv = () => {
    if (!spectrum) return;
    const header =
      'wavelength_um,bandwidth_um,channel,channel_label,detector,flux_uJy,flux_err_uJy,snr,mjd,obs_id,npix,flags,offset_arcsec\n';
    const rows = spectrum.points
      .map((point) =>
        [
          point.wavelength ?? '',
          point.bandwidth ?? '',
          point.channel ?? '',
          point.channelLabel ?? '',
          point.detector ?? '',
          point.flux ?? '',
          point.fluxErr ?? '',
          point.snr ?? '',
          point.mjd,
          point.obsId,
          point.npix,
          point.flags,
          point.offsetArcsec ?? '',
        ].join(','),
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spherex-spectrum-${spectrum.ra.toFixed(4)}-${spectrum.dec.toFixed(4)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border border-line bg-canvas/90" aria-labelledby="spectrum-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-200"
        >
          {open ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronUp size={12} aria-hidden="true" />}
          <span id="spectrum-title">{t.workspace.spectrumTitle}</span>
        </button>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-500">
          {spectrum ? (
            <>
              <span>
                {spectrum.visits} {t.workspace.spectrumVisits}
              </span>
              <span>
                {spectrum.channelsCovered} {t.workspace.spectrumChannels}
              </span>
              {!simple && (
                <span>
                  {spectrum.apertureArcsec.toFixed(0)}″ {t.workspace.spectrumAperture}
                </span>
              )}
            </>
          ) : (
            <span>{t.workspace.spectrumClick}</span>
          )}
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!spectrum}
            className="chip !py-1 transition-colors disabled:opacity-40"
          >
            <Download size={9} aria-hidden="true" />
            CSV
          </button>
          <button type="button" onClick={onClose} className="chip !py-1 transition-colors">
            {t.common.close}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3 sm:p-4">
          {loading && (
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <Loader2 size={12} className="animate-spin text-accent" aria-hidden="true" />
              {t.workspace.spectrumExtracting}
            </div>
          )}

          {!loading && error && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-rose-300">{error}</p>
          )}

          {!loading && !error && !spectrum && pending && onBuild && (
            <div className="flex flex-col items-start gap-2 border border-line bg-black/20 px-3 py-3">
              <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
                {t.workspace.spectrumPending}
              </p>
              <button type="button" onClick={onBuild} className="btn-primary !px-3 !py-1.5 !text-[10px]">
                {t.workspace.spectrumBuild}
              </button>
              <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                {t.workspace.spectrumBuildHint}
              </p>
            </div>
          )}

          {!loading && !error && !spectrum && !pending && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
              {t.workspace.spectrumEmpty}
            </p>
          )}

          {spectrum && measured.length === 0 && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              {t.workspace.spectrumEmpty}
            </p>
          )}

          {spectrum && measured.length > 0 && (
            <>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-[240px] w-full"
                role="img"
                aria-label={t.workspace.spectrumTitle}
              >
                {[0.743, 1.5, 2.5, 3.5, 4.5, 5.0].map((wavelength) => (
                  <g key={wavelength}>
                    <line
                      x1={xFor(wavelength)}
                      x2={xFor(wavelength)}
                      y1={PADDING.top}
                      y2={HEIGHT - PADDING.bottom}
                      stroke="#27272a"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={xFor(wavelength)}
                      y={HEIGHT - 8}
                      fill="#71717a"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="ui-monospace"
                    >
                      {wavelength.toFixed(1)}
                    </text>
                  </g>
                ))}

                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={HEIGHT - PADDING.bottom}
                  y2={HEIGHT - PADDING.bottom}
                  stroke="#3f3f46"
                />

                {/* Selected channel: vertical guide plus its median flux. */}
                <line
                  x1={selectedX}
                  x2={selectedX}
                  y1={PADDING.top}
                  y2={HEIGHT - PADDING.bottom}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <text
                  x={Math.min(WIDTH - PADDING.right - 4, Math.max(PADDING.left + 4, selectedX))}
                  y={PADDING.top + 8}
                  fill="#fb7185"
                  fontSize="9"
                  textAnchor={selectedX > WIDTH * 0.75 ? 'end' : selectedX < WIDTH * 0.25 ? 'start' : 'middle'}
                  fontFamily="ui-monospace"
                >
                  {selected.label} · {selected.wavelength.toFixed(3)} µm
                  {selectedFlux !== null ? ` · ${compact(selectedFlux)} µJy` : ` · ${t.workspace.spectrumNoSignal}`}
                </text>

                {measured.map((point, index) => {
                  const x = xFor(point.wavelength as number);
                  const y = yFor(point.flux as number);
                  const error = Number.isFinite(point.fluxErr ?? Number.NaN)
                    ? Math.abs(point.fluxErr as number)
                    : 0;
                  const color = point.detector
                    ? ARRAY_COLORS[Math.min(5, Math.max(0, point.detector - 1))]
                    : '#a1a1aa';
                  const active = point.channel === selectedBand;
                  return (
                    <g
                      key={index}
                      onClick={simple || !point.channel ? undefined : () => onSelectBand(point.channel as number)}
                      className={simple ? undefined : 'cursor-pointer'}
                    >
                      {error > 0 && (
                        <line
                          x1={x}
                          x2={x}
                          y1={yFor((point.flux as number) - error)}
                          y2={yFor((point.flux as number) + error)}
                          stroke={color}
                          strokeWidth={active ? 1.6 : 1}
                          opacity={active ? 0.95 : 0.5}
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={active ? 3.4 : 2}
                        fill={color}
                        stroke={active ? '#f43f5e' : 'none'}
                        strokeWidth={active ? 1.4 : 0}
                        opacity={active ? 1 : 0.85}
                      >
                        <title>
                          {`${point.channelLabel ?? 'outside'} · ${(point.wavelength as number).toFixed(3)} µm · ${compact(point.flux as number)} ± ${compact(point.fluxErr ?? 0)} µJy · MJD ${point.mjd.toFixed(2)}`}
                        </title>
                      </circle>
                    </g>
                  );
                })}

                <text x={4} y={PADDING.top + 6} fill="#71717a" fontSize="9" fontFamily="ui-monospace">
                  {compact(yMax)}
                </text>
                <text
                  x={4}
                  y={HEIGHT - PADDING.bottom}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="ui-monospace"
                >
                  {compact(yMin)}
                </text>
                <text
                  x={WIDTH / 2}
                  y={HEIGHT - 1}
                  fill="#52525b"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="ui-monospace"
                >
                  λ [µm] · {spectrum.unit}
                </text>
              </svg>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                <span>
                  {spectrum.productsUsed} {t.workspace.spectrumProducts} · {spectrum.channelsCovered}{' '}
                  {t.workspace.spectrumChannels}
                </span>
                {!simple && spectrum.outsideChannels > 0 && (
                  <span>
                    {spectrum.outsideChannels} {t.workspace.spectrumOutside}
                  </span>
                )}
                {!simple && <span>{t.workspace.spectrumApertureNote}</span>}
                {!simple &&
                  ARRAY_LABELS.map((label, index) => (
                    <span key={label} className="flex items-center gap-1">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: ARRAY_COLORS[index] }}
                      />
                      {label}
                    </span>
                  ))}
              </div>
              <p className="mt-1 font-mono text-[8px] leading-relaxed tracking-[0.04em] text-zinc-600">
                {simple ? t.workspace.spectrumSimpleNote : spectrum.note}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
