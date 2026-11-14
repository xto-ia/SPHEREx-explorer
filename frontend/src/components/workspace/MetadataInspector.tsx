import { ScanEye } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDec, formatRa } from '../../lib/coords';
import { formatNumber, formatPercent, formatUTCDateTime } from '../../lib/format';
import type { FieldEpoch } from '../../lib/sky/field';
import { decodeFlags, contaminationFlags } from '../../lib/sky/flags';
import type { SkyFrame } from '../../hooks/useSkyEngine';
import type { ProbeResponse } from '../../lib/sky/workerTypes';

interface MetadataInspectorProps {
  probe: ProbeResponse | null;
  frame: SkyFrame | null;
  epoch: FieldEpoch | null;
  /** Before/after mode: the second visit shown on the right half. */
  epochB?: FieldEpoch | null;
  bandLabel: string;
  fieldRa: number;
  fieldDec: number;
  detector: number;
  /** Beginner surface: hide the percentile statistics and the per-pixel physics. */
  simple?: boolean;
}

export default function MetadataInspector({
  probe,
  frame,
  epoch,
  epochB,
  bandLabel,
  fieldRa,
  fieldDec,
  detector,
  simple = false,
}: MetadataInspectorProps) {
  const { t } = useLanguage();
  const decoded = probe ? decodeFlags(probe.flags) : [];
  const contamination = probe ? contaminationFlags(probe.flags) : [];
  const nominal = decoded.filter((flag) => flag.nominal);

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="metadata-title">
      <div className="flex items-center gap-2">
        <ScanEye size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
        <h3 id="metadata-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
          {t.workspace.metadataTitle}
        </h3>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-px border border-line bg-line">
        <div className="bg-canvas px-2 py-1.5">
          <dt className="label-mono">{t.workspace.epochTime}</dt>
          <dd className="mt-0.5 font-mono text-[10px] text-zinc-200">
            {epoch ? `MJD ${epoch.mjd.toFixed(4)}` : '—'}
            {epochB ? ` → ${epochB.mjd.toFixed(4)}` : ''}
          </dd>
          <dd className="font-mono text-[8px] text-zinc-600">
            {epoch ? `${formatUTCDateTime(epoch.mjd)} UTC` : ''}
          </dd>
          {epochB && (
            <dd className="font-mono text-[8px] text-zinc-600">
              → {formatUTCDateTime(epochB.mjd)} UTC
            </dd>
          )}
        </div>
        <div className="bg-canvas px-2 py-1.5">
          <dt className="label-mono">{t.workspace.exposure}</dt>
          <dd className="mt-0.5 font-mono text-[10px] text-zinc-200">
            {epoch?.exposure ? `${epoch.exposure.toFixed(1)} s` : '—'}
          </dd>
          <dd className="font-mono text-[8px] text-zinc-600">{bandLabel}</dd>
          <dd className="font-mono text-[8px] text-zinc-600">
            {t.common.detectorArray}: {detector === 0 ? t.workspace.allArrays : `D${detector}`}
          </dd>
        </div>
      </dl>

      <div className="mt-2 border border-line bg-black/20 px-2 py-1.5">
        <div className="flex items-center justify-between">
          <span className="label-mono">{t.workspace.pixelReadout}</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            {t.workspace.hoverHint}
          </span>
        </div>
        {probe ? (
          <>
            <p className="mt-1 font-mono text-[10px] text-zinc-200">{formatRa(probe.ra)}</p>
            <p className="font-mono text-[10px] text-zinc-300">{formatDec(probe.dec)}</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-400">
              {Number.isFinite(probe.value) ? `${formatNumber(probe.value, 3)} MJy/sr` : '—'}
              {probe.sigma !== null ? (
                <span className="text-zinc-600">
                  {' '}
                  ± {formatNumber(probe.sigma, 3)}
                  {probe.sigma > 0 && Number.isFinite(probe.value)
                    ? ` · S/N ${formatNumber(probe.value / probe.sigma, 1)}`
                    : ''}
                </span>
              ) : null}
            </p>
            {!simple && (
              <p className="font-mono text-[9px] text-zinc-500">
                {probe.channel >= 1 && probe.channel <= 17
                  ? `${t.workspace.channelShort} ${probe.channel}`
                  : t.workspace.channelOutside}
                {probe.wavelength !== null ? ` · λ ${probe.wavelength.toFixed(4)} µm` : ''}
              </p>
            )}
            <p className="font-mono text-[9px] text-zinc-500">
              {t.workspace.flagsShort}: 0x{probe.flags.toString(16).toUpperCase()}
            </p>
            <div className="mt-1">
              <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                {t.workspace.flagsTitle}
              </p>
              {contamination.length === 0 ? (
                <p className="font-mono text-[9px] text-accent/80">{t.workspace.noFlags}</p>
              ) : (
                <ul className="mt-0.5 space-y-0.5">
                  {contamination.map((flag) => (
                    <li key={flag.bit} className="font-mono text-[9px] text-amber-300/90">
                      {flag.name} · bit {flag.bit}
                    </li>
                  ))}
                </ul>
              )}
              {nominal.length > 0 && (
                <p className="mt-1 font-mono text-[8px] text-zinc-600">
                  {t.workspace.nominalFlags}: {nominal.map((flag) => flag.name).join(', ')}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">{t.workspace.probeHint}</p>
        )}
      </div>

      {!simple && (
        <dl className="mt-2 grid grid-cols-4 gap-px border border-line bg-line">
          {[
            { label: 'p1', value: frame ? formatNumber(frame.stats.p1, 2) : '—' },
            { label: 'median', value: frame ? formatNumber(frame.stats.median, 2) : '—' },
            { label: 'p99', value: frame ? formatNumber(frame.stats.p99, 2) : '—' },
            { label: t.workspace.flagged, value: frame ? formatPercent(frame.stats.flaggedFraction, 1) : '—' },
          ].map((item) => (
            <div key={item.label} className="bg-canvas px-1.5 py-1">
              <dt className="font-mono text-[8px] uppercase tracking-[0.08em] text-zinc-600">{item.label}</dt>
              <dd className="font-mono text-[10px] text-zinc-300">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-2 font-mono text-[8px] leading-relaxed text-zinc-600">
        {t.workspace.metadataSource}: {formatRa(fieldRa)} / {formatDec(fieldDec)} ·{' '}
        {t.common.decimalDegrees}
      </p>
    </section>
  );
}
