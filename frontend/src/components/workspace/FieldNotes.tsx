import { BookOpen, Crosshair } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { findTargetBySlug, type TargetSlug } from '../../data/targets';

interface FieldNotesProps {
  target: TargetSlug | null;
  targetName: string;
  raLabel: string;
  decLabel: string;
}

const LEGEND = [
  { symbol: 'circle', color: 'rgb(var(--accent-bright))', key: 'legendTarget' as const },
  { symbol: 'diamond', color: '#38bdf8', key: 'legendGaia' as const },
  { symbol: 'ring', color: '#f59e0b', key: 'legendWise' as const },
  { symbol: 'path', color: '#f43f5e', key: 'legendNeo' as const },
  { symbol: 'square', color: '#fbbf24', key: 'legendFlags' as const },
];

export default function FieldNotes({ target, targetName, raLabel, decLabel }: FieldNotesProps) {
  const { t } = useLanguage();
  const targetInfo = findTargetBySlug(target);
  const copy = targetInfo ? t.targets[targetInfo.i18nKey] : null;

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="field-notes-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
          <h3 id="field-notes-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
            {t.workspace.fieldNotesTitle}
          </h3>
        </div>
        <Crosshair size={11} className="text-zinc-700" aria-hidden="true" />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{t.workspace.fieldNotesBody}</p>

      <ul className="mt-3 space-y-1.5">
        {t.workspace.readingTips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 font-mono text-[9px] leading-relaxed text-zinc-500">
            <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 bg-accent/70" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-line/70 pt-2">
        <span className="label-mono">{t.workspace.legendTitle}</span>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
          {LEGEND.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
              <span
                aria-hidden="true"
                className={
                  item.symbol === 'circle'
                    ? 'h-1.5 w-1.5 rounded-full'
                    : item.symbol === 'diamond'
                      ? 'h-1.5 w-1.5 rotate-45'
                      : item.symbol === 'ring'
                        ? 'h-1.5 w-1.5 rounded-full border'
                        : item.symbol === 'path'
                          ? 'h-px w-3'
                          : 'h-1.5 w-1.5'
                }
                style={
                  item.symbol === 'ring'
                    ? { borderColor: item.color }
                    : { backgroundColor: item.color }
                }
              />
              {t.workspace[item.key]}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 border-t border-line/70 pt-2">
        <span className="label-mono">{t.workspace.aboutTarget}</span>
        {copy ? (
          <div className="mt-1 space-y-1">
            <p className="font-mono text-[10px] text-zinc-200">{copy.name}</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-accent/70">{copy.subtitle}</p>
            <p className="text-[10px] leading-relaxed text-zinc-500">{copy.description}</p>
          </div>
        ) : (
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{t.workspace.customFieldNote}</p>
        )}
        <p className="mt-1.5 font-mono text-[8px] text-zinc-600">
          {targetName} · {raLabel} · {decLabel}
        </p>
      </div>
    </section>
  );
}
