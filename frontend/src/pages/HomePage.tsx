import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { APP_CONFIG } from '../config/app.config';
import CoordinateForm from '../components/home/CoordinateForm';
import MissionBrief from '../components/home/MissionBrief';
import SpherexModelCanvas from '../components/home/SpherexModelCanvas';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="grid grid-cols-1 gap-10 lg:hero-fold lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
        <div
          className="hero-column flex min-w-0 flex-col justify-center space-y-7"
          style={
            {
              '--hero-copy-rise': `${APP_CONFIG.layout.heroCopyRise}px`,
            } as CSSProperties
          }
        >
          <p className="kicker flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-accent/60" aria-hidden="true" />
            {t.home.kicker}
          </p>

          <h1 className="max-w-2xl text-balance text-[2rem] leading-[1.1] min-[360px]:text-4xl sm:text-5xl lg:text-[3.4rem]">
            {t.home.heroTitle} <span className="text-accent">{t.home.heroTitleAccent}</span>
          </h1>

          <p className="max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t.home.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('coordinate-intake')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="btn-primary"
            >
              <Search size={13} aria-hidden="true" />
              {t.home.heroPrimaryCta}
            </button>
            <Link to="/workspace" className="btn-ghost">
              <Boxes size={13} aria-hidden="true" />
              {t.common.openWorkspace}
            </Link>
            <Link to="/docs#intake" className="link-mono ml-1">
              {t.home.heroSecondaryCta} →
            </Link>
          </div>
        </div>

        {/* Borderless stage: the spacecraft floats directly on the page starfield.
            Its height is tied to the first screen so the copy column always
            shares the same vertical centring reference. */}
        <SpherexModelCanvas className="lg:aspect-auto lg:h-[calc(100dvh_-_7rem)] lg:max-h-[52rem]" />
      </section>

      {/* ------------------------------------------- Mission stats band */}
      <section className="mt-10">
        <dl className="grid grid-cols-2 border border-line bg-black/25 sm:grid-cols-4">
          {[
            { value: '102', label: t.home.statsScientific },
            { value: t.home.statsCadenceValue, label: t.home.statsCadence },
            { value: '6', label: t.home.statsArrays },
            { value: '∞', label: t.home.statsAccess },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={[
                'px-4 py-3',
                index !== 0 ? 'border-l border-line' : '',
                index >= 2 ? 'border-t border-line sm:border-t-0' : '',
              ].join(' ')}
            >
              <dt className="whitespace-nowrap font-mono text-base font-semibold text-zinc-100">
                {stat.value}
              </dt>
              <dd className="mt-0.5 font-mono text-[9px] uppercase leading-tight tracking-[0.14em] text-zinc-500">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------- Coordinate form */}
      <section className="mt-14">
        <div className="mx-auto w-full max-w-5xl">
          <CoordinateForm />

          {/* The how-to material (formats, FoV sizes, workflow) lives in the docs. */}
          <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-zinc-600">
            {t.home.intakeDocHint}{' '}
            <Link
              to="/docs#intake"
              className="text-accent underline-offset-4 transition-colors hover:text-accent-bright hover:underline"
            >
              {t.home.intakeDocLink} →
            </Link>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- Mission section */}
      <MissionBrief />

      {/* --------------------------------------------------------- Challenge CTA */}
      <section
        aria-labelledby="challenge-title"
        className="mt-16 grid gap-6 border border-line bg-surface p-6 backdrop-blur-md md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] md:items-center"
      >
        <div>
          <p className="kicker">{t.home.challengeKicker}</p>
          <h2 id="challenge-title" className="mt-2 text-lg sm:text-xl">
            {t.home.challengeTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">{t.home.challengeBody}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/workspace" className="btn-primary">
            <Boxes size={13} aria-hidden="true" />
            {t.common.openWorkspace}
          </Link>
          <Link to="/docs" className="btn-ghost">
            {t.common.readDocs}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
