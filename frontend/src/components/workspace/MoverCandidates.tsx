import { Loader2, Radar, ScanSearch } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDec, formatRa } from '../../lib/coords';
import { formatNumber } from '../../lib/format';
import type { MoverCandidate } from '../../lib/sky/workerTypes';
import type { WorkspaceMode } from '../../hooks/useUrlSync';

interface MoverCandidatesProps {
  candidates: MoverCandidate[];
  loading: boolean;
  dataReady: boolean;
  threshold: number;
  sigma: number;
  mode: WorkspaceMode;
  epochA: number;
  epochB: number;
  onScan: () => void;
  onSelect: (candidate: MoverCandidate, index: number) => void;
}

export default function MoverCandidates({
  candidates,
  loading,
  dataReady,
  threshold,
  sigma,
  mode,
  epochA,
  epochB,
  onScan,
  onSelect,
}: MoverCandidatesProps) {
  const { t } = useLanguage();

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="movers-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radar size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
          <h3 id="movers-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
            {t.workspace.moversTitle}
          </h3>
        </div>
        <button
          type="button"
          onClick={onScan}
          disabled={loading || mode !== 'diff' || !dataReady}
          className="flex items-center gap-1 border border-line px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-400 transition-colors hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:text-zinc-700"
          title={
            mode === 'diff'
              ? dataReady
                ? t.workspace.moversScan
                : t.workspace.moversWaiting
              : t.workspace.moversNeedDiff
          }
        >
          {loading ? (
            <Loader2 size={9} className="animate-spin" aria-hidden="true" />
          ) : (
            <ScanSearch size={9} aria-hidden="true" />
          )}
          {loading ? t.workspace.moversScanning : t.workspace.moversScan}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{t.workspace.moversBody}</p>

      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-zinc-600">
        {t.workspace.moversThreshold
          .replace('{sigma}', sigma.toFixed(3))
          .replace('{threshold}', formatNumber(threshold, 3))}{' '}
        · E{epochA + 1}→E{epochB + 1}
      </p>

      {mode !== 'diff' && (
        <p className="mt-2 border border-line/70 bg-black/20 px-2 py-1.5 font-mono text-[9px] leading-relaxed text-zinc-600">
          {t.workspace.moversNeedDiff}
        </p>
      )}

      {candidates.length > 0 ? (
        <ol className="mt-2 max-h-64 divide-y divide-line overflow-y-auto border border-line">
          {candidates.map((candidate, index) => (
            <li key={`${candidate.x}-${candidate.y}`}>
              <button
                type="button"
                onClick={() => onSelect(candidate, index)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-5 w-5 shrink-0 place-items-center border font-mono text-[8px] ${
                    candidate.sign > 0
                      ? 'border-[#f43f5e]/60 text-[#f43f5e]'
                      : 'border-[#38bdf8]/60 text-[#38bdf8]'
                  }`}
                >
                  {candidate.sign > 0 ? '+' : '−'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[9px] text-zinc-300">
                    {t.workspace.moversUnmatched}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[8px] text-zinc-600">
                    {formatRa(candidate.ra)} · {formatDec(candidate.dec)}
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-[8px] leading-tight text-zinc-500">
                  <span className="block text-zinc-300">
                    {candidate.significance > 999 ? '>999' : candidate.significance.toFixed(1)}σ
                  </span>
                  <span className={candidate.sign > 0 ? 'text-[#fb7185]' : 'text-[#7dd3fc]'}>
                    {candidate.delta > 0 ? '+' : ''}
                    {formatNumber(candidate.delta, 2)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 border border-dashed border-line/70 px-2 py-3 text-center font-mono text-[9px] leading-relaxed text-zinc-600">
          {mode !== 'diff' ? t.workspace.moversHint : dataReady ? t.workspace.moversEmpty : t.workspace.moversWaiting}
        </p>
      )}
    </section>
  );
}
