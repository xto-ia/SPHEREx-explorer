import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ExternalLink, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { APP_CONFIG } from '../config/app.config';
import CoordinateForm from '../components/home/CoordinateForm';
import MissionBrief from '../components/home/MissionBrief';
import SpherexModelCanvas from '../components/home/SpherexModelCanvas';

/** NASA Space Apps Challenge — hackathon home and this year's SPHEREx brief. */
const SPACE_APPS_URL = 'https://www.spaceappschallenge.org/';
const SPHEREX_CHALLENGE_URL =
  'https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/';

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

      {/* ------------------- Coordinate intake + mission overview (side by side on 1440px+) */}
      <section className="mt-14 grid grid-cols-1 gap-10 min-[1440px]:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] min-[1440px]:items-center">
        <div className="min-w-0">
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

        <MissionBrief />
      </section>

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
          <a
            href={SPACE_APPS_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary"
          >
            <ExternalLink size={13} aria-hidden="true" />
            {t.home.challengePrimaryCta}
          </a>
          <a
            href={SPHEREX_CHALLENGE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost"
          >
            {t.home.challengeSecondaryCta}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
