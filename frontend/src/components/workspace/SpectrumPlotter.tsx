import { ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatNumber } from '../../lib/format';
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
}

const PADDING = { left: 44, right: 16, top: 14, bottom: 22 };
const WIDTH = 960;
const HEIGHT = 220;

export default function SpectrumPlotter({
  spectrum,
  loading,
  error,
  open,
  onToggle,
  onClose,
  selectedBand,
  onSelectBand,
}: SpectrumPlotterProps) {
  const { t } = useLanguage();

  const values = spectrum?.flux.map((value) => (value === null ? Number.NaN : value)) ?? [];
  const finite = values.filter((value) => Number.isFinite(value) && value > 0);
  const maxFlux = finite.length ? Math.max(...finite) * 1.15 : 1;
  const minFlux = finite.length ? Math.min(...finite) * 0.85 : 0;

  const xFor = (wavelength: number) => {
    const low = spectrum?.wavelength[0] ?? 0.75;
    const high = spectrum?.wavelength[spectrum.wavelength.length - 1] ?? 5;
    return PADDING.left + ((wavelength - low) / (high - low)) * (WIDTH - PADDING.left - PADDING.right);
  };
  const yFor = (flux: number) => {
    const span = Math.max(maxFlux - minFlux, 1e-6);
    return HEIGHT - PADDING.bottom - ((flux - minFlux) / span) * (HEIGHT - PADDING.top - PADDING.bottom);
  };

  const points =
    spectrum?.wavelength.map((wavelength, index) => ({
      wavelength,
      flux: values[index],
      x: xFor(wavelength),
      y: yFor(values[index]),
    })) ?? [];

  const path = points
    .filter((point) => Number.isFinite(point.flux))
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');

  const downloadCsv = () => {
    if (!spectrum) return;
    const header = 'wavelength_um,flux_mJy,npix\n';
    const rows = spectrum.wavelength
      .map((wavelength, index) => `${wavelength.toFixed(4)},${spectrum.flux[index] ?? ''},${spectrum.npix[index]}`)
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
              <span>{spectrum.detectors.map((d) => `D${d}`).join(' ')}</span>
              <span>{spectrum.apertureArcsec.toFixed(0)}″ {t.workspace.spectrumAperture}</span>
              <span>MJD {spectrum.mjd.toFixed(2)}</span>
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

          {!loading && !error && !spectrum && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
              {t.workspace.spectrumEmpty}
            </p>
          )}

          {spectrum && (
            <>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-[220px] w-full"
                role="img"
                aria-label={t.workspace.spectrumTitle}
              >
                {[0.75, 1.5, 2.5, 3.5, 4.5, 5].map((wavelength) => (
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
                      y={HEIGHT - 6}
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
                <path d={path} fill="none" stroke="rgb(var(--accent-bright))" strokeWidth="1.4" />
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={index + 1 === selectedBand ? 3.2 : 1.6}
                    fill={index + 1 === selectedBand ? '#f43f5e' : 'rgb(var(--accent))'}
                    opacity={Number.isFinite(point.flux) ? 0.9 : 0}
                    onClick={() => onSelectBand(index + 1)}
                    className="cursor-pointer"
                  />
                ))}
                <text x={4} y={PADDING.top + 6} fill="#71717a" fontSize="9" fontFamily="ui-monospace">
                  {formatNumber(maxFlux, 1)}
                </text>
                <text
                  x={4}
                  y={HEIGHT - PADDING.bottom}
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="ui-monospace"
                >
                  {formatNumber(minFlux, 1)}
                </text>
                <text
                  x={WIDTH / 2}
                  y={HEIGHT - PADDING.bottom + 16}
                  fill="#52525b"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="ui-monospace"
                >
                  λ [µm] · {spectrum.unit}
                </text>
              </svg>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                {spectrum.method}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
