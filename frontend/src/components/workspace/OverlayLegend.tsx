import { Layers } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Marker key for the catalogue overlays. Kept beside the viewport so a colour
 * on screen can be traced back to its archive without leaving the workspace.
 */
const LEGEND = [
  { symbol: 'circle', color: 'rgb(var(--accent-bright))', key: 'legendTarget' as const },
  { symbol: 'diamond', color: '#38bdf8', key: 'legendGaia' as const },
  { symbol: 'ring', color: '#f59e0b', key: 'legendWise' as const },
  { symbol: 'path', color: '#f43f5e', key: 'legendNeo' as const },
  { symbol: 'square', color: '#fbbf24', key: 'legendFlags' as const },
];

export default function OverlayLegend() {
  const { t } = useLanguage();

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="overlay-legend-title">
      <div className="flex items-center gap-2">
        <Layers size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
        <h3
          id="overlay-legend-title"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200"
        >
          {t.workspace.legendTitle}
        </h3>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
        {LEGEND.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-1.5 font-mono text-[9px] leading-tight text-zinc-500"
          >
            <span
              aria-hidden="true"
              className={
                item.symbol === 'circle'
                  ? 'h-1.5 w-1.5 shrink-0 rounded-full'
                  : item.symbol === 'diamond'
                    ? 'h-1.5 w-1.5 shrink-0 rotate-45'
                    : item.symbol === 'ring'
                      ? 'h-1.5 w-1.5 shrink-0 rounded-full border'
                      : item.symbol === 'path'
                        ? 'h-px w-3 shrink-0'
                        : 'h-1.5 w-1.5 shrink-0'
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
    </section>
  );
}
