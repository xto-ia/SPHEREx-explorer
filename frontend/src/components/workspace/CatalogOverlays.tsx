import { Radio, Satellite, Telescope } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { WorkspaceState } from '../../hooks/useUrlSync';

interface CatalogOverlaysProps {
  overlays: WorkspaceState['overlays'];
  counts: { gaia: number; wise: number; neossat: number };
  neossatError?: string | null;
  onToggle: (key: keyof WorkspaceState['overlays'], value: boolean) => void;
}

export default function CatalogOverlays({
  overlays,
  counts,
  neossatError = null,
  onToggle,
}: CatalogOverlaysProps) {
  const { t } = useLanguage();

  const neossatDetail = neossatError
    ? t.workspace.overlayNeossatError
    : counts.neossat > 0
      ? t.workspace.overlayNeossatDetail.replace('{n}', String(counts.neossat))
      : t.workspace.overlayNeossatEmpty;

  const layers: Array<{
    key: keyof WorkspaceState['overlays'];
    label: string;
    detail: string;
    color: string;
    icon: typeof Telescope;
    count: number | null;
    muted?: boolean;
  }> = [
    {
      key: 'gaia',
      label: t.workspace.overlayGaia,
      detail: t.workspace.overlayGaiaDetail.replace('{n}', String(counts.gaia)),
      color: '#38bdf8',
      icon: Telescope,
      count: counts.gaia,
    },
    {
      key: 'wise',
      label: t.workspace.overlayWise,
      detail: t.workspace.overlayWiseDetail.replace('{n}', String(counts.wise)),
      color: '#f59e0b',
      icon: Radio,
      count: counts.wise,
    },
    {
      key: 'neossat',
      label: t.workspace.overlayNeossat,
      detail: neossatDetail,
      color: '#f43f5e',
      icon: Satellite,
      count: counts.neossat,
      muted: counts.neossat === 0,
    },
  ];

  return (
    <section className="bg-canvas/90 p-4" aria-labelledby="overlays-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Telescope size={13} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
          <h3 id="overlays-title" className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-200">
            {t.workspace.overlaysTitle}
          </h3>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-line border border-line">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const active = overlays[layer.key];
          return (
            <li key={layer.key}>
              <button
                type="button"
                onClick={() => onToggle(layer.key, !active)}
                aria-pressed={active}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span
                  aria-hidden="true"
                  className="grid h-5 w-5 shrink-0 place-items-center border"
                  style={{
                    borderColor: active ? layer.color : '#27272a',
                    color: active ? layer.color : '#52525b',
                  }}
                >
                  <Icon size={10} strokeWidth={1.6} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] text-zinc-200">{layer.label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.06em] text-zinc-600">
                    {layer.detail}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    layer.muted ? 'bg-zinc-800' : active ? 'bg-accent' : 'bg-zinc-700'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 grid grid-cols-3 gap-1">
        {(['grid', 'labels', 'tracks'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key, !overlays[key])}
            aria-pressed={overlays[key]}
            className={`border px-1 py-1 font-mono text-[8px] uppercase tracking-[0.08em] transition-colors ${
              overlays[key]
                ? 'border-accent/40 bg-accent/5 text-accent'
                : 'border-line text-zinc-600 hover:text-zinc-300'
            }`}
          >
            {key === 'grid' ? t.workspace.overlayGrid : key === 'labels' ? t.workspace.overlayLabels : t.workspace.overlayTracks}
          </button>
        ))}
      </div>
    </section>
  );
}
