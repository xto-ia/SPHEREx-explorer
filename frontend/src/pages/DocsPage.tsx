import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Copy, ExternalLink, Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { TEST_TARGETS } from '../data/targets';
import { toUrlNumber } from '../lib/coords';

const SOURCE_LINKS = [
  { label: 'IRSA SIA2', href: 'https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_qr3&POS=circle+269.45+4.69+0.05' },
  { label: 'IRSA TAP', href: 'https://irsa.ipac.caltech.edu/TAP' },
  { label: 'AWS Open Data', href: 'https://registry.opendata.aws/spherex-qr3/' },
  { label: 'Gaia DR3', href: 'https://gea.esac.esa.int/archive/' },
  { label: 'CADC', href: 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/' },
  { label: 'CADC CAOM2', href: 'https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/caom2ops/' },
];

/** Marker shapes used by the workspace overlays, documented in the intake guide. */
const OVERLAY_LEGEND = [
  { key: 'legendTarget', shape: 'circle', color: 'rgb(var(--accent-bright))' },
  { key: 'legendGaia', shape: 'diamond', color: '#38bdf8' },
  { key: 'legendWise', shape: 'ring', color: '#f59e0b' },
  { key: 'legendNeo', shape: 'line', color: '#f43f5e' },
  { key: 'legendFlags', shape: 'square', color: '#fbbf24' },
] as const;

/** Numbered procedure list shared by the intake workflow and the data pipeline. */
function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((step, index) => (
        <li
          key={step}
          className="flex items-start gap-3 border border-line bg-canvas/90 p-3 font-mono text-[11px] leading-relaxed text-zinc-400"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center border border-line text-[9px] text-accent">
            {String(index + 1).padStart(2, '0')}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

export default function DocsPage() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const sections = [
    { id: 'intake', label: t.docs.sectionIntake },
    { id: 'capabilities', label: t.docs.sectionCapabilities },
    { id: 'modes', label: t.docs.sectionModes },
    { id: 'sources', label: t.docs.sectionSources },
    { id: 'pipeline', label: t.docs.sectionPipeline },
    { id: 'walkthrough', label: t.docs.sectionWalkthrough },
    { id: 'embed', label: t.docs.sectionEmbed },
    { id: 'shortcuts', label: t.docs.sectionShortcuts },
    { id: 'limitations', label: t.docs.sectionLimitations },
  ];

  const capabilities = [
    { title: t.docs.capabilityBlinkTitle, body: t.docs.capabilityBlinkBody, tag: '01' },
    { title: t.docs.capabilityDiffTitle, body: t.docs.capabilityDiffBody, tag: '02' },
    { title: t.docs.capabilityArrayTitle, body: t.docs.capabilityArrayBody, tag: '03' },
    { title: t.docs.capabilitySpectrumTitle, body: t.docs.capabilitySpectrumBody, tag: '04' },
    { title: t.docs.capabilityScanTitle, body: t.docs.capabilityScanBody, tag: '05' },
    { title: t.docs.capabilityCompareTitle, body: t.docs.capabilityCompareBody, tag: '06' },
  ];

  const sources = [
    { title: t.docs.sourceIrsaTitle, body: t.docs.sourceIrsaBody, tag: 'IRSA' },
    { title: t.docs.sourceGaiaTitle, body: t.docs.sourceGaiaBody, tag: 'GAIA' },
    { title: t.docs.sourceNeossatTitle, body: t.docs.sourceNeossatBody, tag: 'CADC' },
  ];

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(t.docs.embedExample);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
      <header className="border-b border-line pb-5">
        <p className="kicker">{t.docs.kicker}</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">{t.docs.title}</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">{t.docs.subtitle}</p>

        <nav aria-label={t.docs.onThisPage} className="mt-4 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="chip hover:border-line-hover hover:text-zinc-200">
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-12">
          {/* Coordinates, field of view & workflow */}
          <section id="intake" aria-labelledby="intake-title" className="scroll-mt-20">
            <h2 id="intake-title" className="text-lg sm:text-xl">
              {t.docs.sectionIntake}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.intakeBody}
            </p>

            <div className="mt-4 grid gap-px border border-line bg-line lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <article className="bg-canvas/90 p-4">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                  {t.docs.intakeCoordinatesTitle}
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {t.docs.intakeCoordinatesPoints.map((point) => (
                    <li key={point} className="flex gap-2 text-[12px] leading-relaxed text-zinc-500">
                      <span aria-hidden="true" className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 border border-line bg-black/25">
                  <p className="border-b border-line px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                    {t.docs.intakeExamplesTitle}
                  </p>
                  <ul className="divide-y divide-line">
                    {t.docs.intakeExamples.map((example) => (
                      <li
                        key={example.label}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
                          {example.label}
                        </span>
                        <code className="font-mono text-[11px] text-zinc-300">{example.value}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="bg-canvas/90 p-4">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                  {t.docs.intakeFovTitle}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{t.docs.intakeFovBody}</p>

                <ul className="mt-3 divide-y divide-line border border-line">
                  {t.docs.intakeFovGuide.map((item) => (
                    <li key={item.label} className="flex gap-3 px-3 py-2">
                      <span className="w-14 shrink-0 font-mono text-[10px] text-accent/90">{item.label}</span>
                      <span className="text-[11px] leading-relaxed text-zinc-500">{item.body}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-600">
                  {t.docs.intakeFovNote}
                </p>
              </article>
            </div>

            <p className="mt-3 border border-line bg-canvas/90 p-3 text-[12px] leading-relaxed text-zinc-500">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent/90">
                {t.docs.intakeRandomTitle} ·{' '}
              </span>
              {t.docs.intakeRandomBody}
            </p>

            <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {t.docs.intakeWorkflowTitle}
            </h3>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.intakeWorkflowBody}
            </p>
            <StepList steps={t.docs.intakeWorkflowSteps} />

            <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {t.docs.readingTipsTitle}
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {t.docs.readingTips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 border border-line bg-canvas/90 p-3 text-[12px] leading-relaxed text-zinc-500"
                >
                  <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 border border-line bg-canvas/90 p-3">
              <p className="label-mono">{t.docs.overlaysLegendTitle}</p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {OVERLAY_LEGEND.map((item) => (
                  <li key={item.key} className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span
                      aria-hidden="true"
                      className={
                        item.shape === 'circle'
                          ? 'h-1.5 w-1.5 rounded-full'
                          : item.shape === 'diamond'
                            ? 'h-1.5 w-1.5 rotate-45'
                            : item.shape === 'ring'
                              ? 'h-1.5 w-1.5 rounded-full border'
                              : item.shape === 'line'
                                ? 'h-px w-3'
                                : 'h-1.5 w-1.5'
                      }
                      style={
                        item.shape === 'ring'
                          ? { borderColor: item.color }
                          : { backgroundColor: item.color }
                      }
                    />
                    {t.docs[item.key]}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Capabilities */}
          <section id="capabilities" aria-labelledby="capabilities-title" className="scroll-mt-20">
            <h2 id="capabilities-title" className="text-lg sm:text-xl">
              {t.docs.sectionCapabilities}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.capabilitiesBody}
            </p>

            <ul className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
              {capabilities.map((item) => (
                <li key={item.tag} className="bg-canvas/90 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                      {item.title}
                    </h3>
                    <span className="font-mono text-[9px] text-zinc-700">{item.tag}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Two workspace modes */}
          <section id="modes" aria-labelledby="modes-title" className="scroll-mt-20">
            <h2 id="modes-title" className="text-lg sm:text-xl">
              {t.docs.sectionModes}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.modesBody}
            </p>

            <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
              {[
                {
                  title: t.docs.modeSimpleTitle,
                  audience: t.docs.modeSimpleFor,
                  points: t.docs.modeSimplePoints,
                  tag: 'SIMPLE',
                },
                {
                  title: t.docs.modeAdvancedTitle,
                  audience: t.docs.modeAdvancedFor,
                  points: t.docs.modeAdvancedPoints,
                  tag: 'ADVANCED',
                },
              ].map((mode) => (
                <article key={mode.tag} className="bg-canvas/90 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                      {mode.title}
                    </h3>
                    <span className="font-mono text-[9px] text-zinc-700">{mode.tag}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-accent/80">{mode.audience}</p>
                  <ul className="mt-3 space-y-1.5">
                    {mode.points.map((point) => (
                      <li key={point} className="flex gap-2 text-[12px] leading-relaxed text-zinc-500">
                        <span aria-hidden="true" className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {t.docs.modeFeaturesTitle}
            </h3>
            <div className="mt-2 overflow-x-auto border border-line bg-canvas/90">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      {t.docs.modeFeatureName}
                    </th>
                    <th className="w-16 px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      {t.docs.modeFeatureSimple}
                    </th>
                    <th className="w-20 px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      {t.docs.modeFeatureAdvanced}
                    </th>
                    <th className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                      {t.docs.modeFeatureNote}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.docs.modeFeatures.map((feature) => (
                    <tr key={feature.name} className="border-b border-line/60 last:border-b-0">
                      <td className="px-3 py-2 text-[11px] leading-relaxed text-zinc-300">{feature.name}</td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-zinc-400">
                        {feature.simple ? '✓' : '—'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-zinc-400">
                        {feature.advanced ? '✓' : '—'}
                      </td>
                      <td className="px-3 py-2 text-[11px] leading-relaxed text-zinc-500">{feature.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sources */}
          <section id="sources" aria-labelledby="sources-title" className="scroll-mt-20">
            <h2 id="sources-title" className="text-lg sm:text-xl">
              {t.docs.sectionSources}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.sourcesBody}
            </p>

            <ul className="mt-4 divide-y divide-line border border-line bg-canvas/90">
              {sources.map((item) => (
                <li key={item.tag} className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-5">
                  <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    {item.tag}
                  </span>
                  <div>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-3 border border-line bg-black/25 p-3 font-mono text-[10px] leading-relaxed text-zinc-600">
              {t.docs.fallbackNote}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {SOURCE_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="chip hover:border-line-hover hover:text-zinc-200"
                >
                  {link.label}
                  <ExternalLink size={9} aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          {/* Pipeline */}
          <section id="pipeline" aria-labelledby="pipeline-title" className="scroll-mt-20">
            <h2 id="pipeline-title" className="text-lg sm:text-xl">
              {t.docs.sectionPipeline}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.pipelineBody}
            </p>

            <StepList steps={t.docs.pipelineSteps} />

            <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-2">
              <p className="bg-canvas/90 p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
                {t.docs.provenanceNote}
              </p>
              <p className="bg-canvas/90 p-3 font-mono text-[10px] leading-relaxed text-zinc-500">
                {t.docs.upgradeNote}
              </p>
            </div>
          </section>

          {/* Walkthrough */}
          <section id="walkthrough" aria-labelledby="walkthrough-title" className="scroll-mt-20">
            <h2 id="walkthrough-title" className="text-lg sm:text-xl">
              {t.docs.sectionWalkthrough}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.walkthroughBody}
            </p>

            <ul className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {TEST_TARGETS.map((target) => {
                const copy = t.targets[target.i18nKey];
                const search = new URLSearchParams({
                  ra: toUrlNumber(target.ra),
                  dec: toUrlNumber(target.dec),
                  fov: String(target.recommendedFov),
                  target: target.slug,
                });
                return (
                  <li key={target.slug} className="bg-canvas/90 p-4">
                    <h3 className="font-mono text-[11px] tracking-[0.06em] text-zinc-100">{copy.name}</h3>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent/80">
                      {copy.subtitle}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{copy.description}</p>
                    <p className="mt-2 font-mono text-[9px] tracking-[0.06em] text-zinc-700">
                      {target.raSexagesimal} · {target.decSexagesimal}
                    </p>
                    <Link
                      to={`/workspace?${search.toString()}`}
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-accent transition-colors hover:text-accent-bright"
                    >
                      <Play size={8} aria-hidden="true" />
                      {t.home.targetsOpen}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Embed API */}
          <section id="embed" aria-labelledby="embed-title" className="scroll-mt-20">
            <h2 id="embed-title" className="text-lg sm:text-xl">
              {t.docs.sectionEmbed}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.embedBody}
            </p>

            <ul className="mt-4 divide-y divide-line border border-line bg-canvas/90">
              {t.docs.embedParams.map((param) => (
                <li key={param} className="px-4 py-2 font-mono text-[11px] leading-relaxed text-zinc-500">
                  {param}
                </li>
              ))}
            </ul>

            <div className="mt-4 border border-line bg-canvas/90">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  {t.docs.embedExampleTitle}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    to="/workspace?ra=269.452075&dec=4.693364&fov=0.5&target=barnard&mode=diff&band=0"
                    className="btn-ghost !px-2 !py-1 !text-[10px]"
                  >
                    {t.common.openWorkspace}
                    <ArrowUpRight size={10} aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={copySnippet} className="btn-ghost !px-2 !py-1 !text-[10px]">
                    {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                    {copied ? t.common.copied : t.common.copy}
                  </button>
                </div>
              </div>
              <pre className="overflow-x-auto px-3 py-3 font-mono text-[11px] leading-relaxed text-zinc-400">
                <code>{t.docs.embedExample}</code>
              </pre>
            </div>

            <p className="mt-2 font-mono text-[10px] text-zinc-700">{t.docs.embedNote}</p>
          </section>

          {/* Shortcuts */}
          <section id="shortcuts" aria-labelledby="shortcuts-title" className="scroll-mt-20">
            <h2 id="shortcuts-title" className="text-lg sm:text-xl">
              {t.docs.sectionShortcuts}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.shortcutsBody}
            </p>
            <ul className="mt-4 divide-y divide-line border border-line bg-canvas/90">
              {t.docs.shortcuts.map((shortcut) => (
                <li key={shortcut.keys} className="flex items-center gap-4 px-4 py-2">
                  <kbd className="min-w-[5rem] border border-line bg-black/40 px-2 py-1 text-center font-mono text-[10px] text-zinc-200">
                    {shortcut.keys}
                  </kbd>
                  <span className="text-[12px] leading-relaxed text-zinc-500">{shortcut.action}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Limitations */}
          <section id="limitations" aria-labelledby="limitations-title" className="scroll-mt-20">
            <h2 id="limitations-title" className="text-lg sm:text-xl">
              {t.docs.sectionLimitations}
            </h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
              {t.docs.limitationsBody}
            </p>
            <ul className="mt-4 space-y-1.5">
              {t.docs.limitations.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 border border-line/70 bg-canvas/60 px-3 py-2 font-mono text-[10px] leading-relaxed text-zinc-500"
                >
                  <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-warn/70" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Side rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3">
            <div className="border border-line bg-surface backdrop-blur-md">
              <div className="border-b border-line px-4 py-3">
                <span className="label-mono">{t.home.targetsHeading}</span>
              </div>
              <ul className="divide-y divide-line">
                {TEST_TARGETS.map((target) => {
                  const search = new URLSearchParams({
                    ra: toUrlNumber(target.ra),
                    dec: toUrlNumber(target.dec),
                    fov: String(target.recommendedFov),
                    target: target.slug,
                  });
                  return (
                    <li key={target.slug}>
                      <Link
                        to={`/workspace?${search.toString()}`}
                        className="group block px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <p className="font-mono text-[10px] tracking-[0.04em] text-zinc-300 group-hover:text-accent">
                          {t.targets[target.i18nKey].name}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-zinc-600">
                          {target.ra.toFixed(4)}° / {target.dec.toFixed(4)}°
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border border-line bg-surface p-4 backdrop-blur-md">
              <p className="label-mono">{t.docs.sectionShortcuts}</p>
              <ul className="mt-2 space-y-1 font-mono text-[9px] leading-relaxed text-zinc-500">
                {t.docs.shortcuts.slice(0, 5).map((shortcut) => (
                  <li key={shortcut.keys} className="flex justify-between gap-2">
                    <span className="text-zinc-300">{shortcut.keys}</span>
                    <span className="truncate text-right">{shortcut.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
