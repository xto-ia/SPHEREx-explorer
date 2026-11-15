import { Radio, Satellite, Telescope } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { OverlayLayer, OverlayMeta } from '../../lib/api';
import type { WorkspaceState } from '../../hooks/useUrlSync';

interface CatalogOverlaysProps {
  overlays: WorkspaceState['overlays'];
  counts: { gaia: number; wise: number; neossat: number };
  /** How complete each layer is: `truncated` / `total` / `magLimit`. */
  meta: Partial<Record<OverlayLayer, OverlayMeta>>;
  /** Per-layer upstream failures, shaped `"wise: timeout"`. */
  errors: string[];
  onToggle: (key: keyof WorkspaceState['overlays'], value: boolean) => void;
}

export default function CatalogOverlays({
  overlays,
  counts,
  meta,
  errors,
  onToggle,
}: CatalogOverlaysProps) {
  const { t } = useLanguage();

  const errorFor = (layer: OverlayLayer): string | null => {
    const entry = errors.find((item) => item.startsWith(`${layer}:`));
    return entry ? entry.slice(layer.length + 1).trim() : null;
  };

  const gaiaError = errorFor('gaia');
  const wiseError = errorFor('wise');
  const neossatError = errorFor('neossat');

  const gaiaMeta = meta.gaia;
  const wiseMeta = meta.wise;
  const neossatMeta = meta.neossat;

  /**
   * A layer without `meta` and without an error has not answered yet: WISE can
   * take a minute, and "no WISE source in this field" would be a lie until the
   * archive actually replies.
   */
  const isPending = (layer: OverlayLayer) => !meta[layer] && !errorFor(layer);

  const gaiaDetail = gaiaError
    ? t.workspace.overlayUnavailable
    : isPending('gaia')
      ? t.workspace.overlayPending
      : gaiaMeta?.truncated
        ? t.workspace.overlayTruncated
            .replace('{n}', String(gaiaMeta.returned))
            .replace('{total}', String(gaiaMeta.total ?? '—'))
            .replace('{mag}', gaiaMeta.magLimit != null ? gaiaMeta.magLimit.toFixed(1) : '—')
        : t.workspace.overlayAllSources.replace('{n}', String(counts.gaia));

  const wiseDetail = wiseError
    ? t.workspace.overlayUnavailable
    : isPending('wise')
      ? t.workspace.overlayPending
      : counts.wise > 0
        ? (wiseMeta?.truncated ? t.workspace.overlayWiseTruncated : t.workspace.overlayWiseDetail).replace(
            '{n}',
            String(counts.wise),
          )
        : t.workspace.overlayWiseEmpty;

  const neossatDetail = neossatError
    ? t.workspace.overlayUnavailable
    : isPending('neossat')
      ? t.workspace.overlayPending
      : neossatMeta?.truncated
        ? t.workspace.overlayNeossatTruncated
            .replace('{n}', String(neossatMeta.returned))
            .replace('{total}', String(neossatMeta.total ?? '—'))
        : counts.neossat > 0
          ? (counts.neossat === 1
              ? t.workspace.overlayNeossatDetailOne
              : t.workspace.overlayNeossatDetail
            ).replace('{n}', String(counts.neossat))
          : t.workspace.overlayNeossatEmpty;

  const layers: Array<{
    key: keyof WorkspaceState['overlays'];
    label: string;
    detail: string;
    color: string;
    icon: typeof Telescope;
    count: number | null;
    muted?: boolean;
    failed?: boolean;
  }> = [
    {
      key: 'gaia',
      label: t.workspace.overlayGaia,
      detail: gaiaDetail,
      color: '#38bdf8',
      icon: Telescope,
      count: counts.gaia,
      failed: Boolean(gaiaError),
    },
    {
      key: 'wise',
      label: t.workspace.overlayWise,
      detail: wiseDetail,
      color: '#f59e0b',
      icon: Radio,
      count: counts.wise,
      muted: counts.wise === 0,
      failed: Boolean(wiseError),
    },
    {
      key: 'neossat',
      label: t.workspace.overlayNeossat,
      detail: neossatDetail,
      color: '#f43f5e',
      icon: Satellite,
      count: counts.neossat,
      muted: counts.neossat === 0,
      failed: Boolean(neossatError),
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
                title={layer.failed ? layer.detail : undefined}
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
                  <span
                    className={`mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.06em] ${
                      layer.failed ? 'text-warn/90' : 'text-zinc-600'
                    }`}
                  >
                    {layer.detail}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    layer.failed
                      ? 'bg-warn'
                      : layer.muted
                        ? 'bg-zinc-800'
                        : active
                          ? 'bg-accent'
                          : 'bg-zinc-700'
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

      {/* Proper-motion arrows are drawn on a time baseline, not as a sky-length:
          at 6.15"/pixel a real 10-year vector is a fraction of a pixel. */}
      <p className="mt-2 font-mono text-[8px] leading-relaxed text-zinc-700">
        {t.workspace.overlayPmNote}
      </p>
    </section>
  );
}
