import { NavLink, Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LANGUAGE_LABELS, LANGUAGES } from '../../i18n/translations';

type NavKey = 'explorer' | 'workspace' | 'docs';

const NAV_ITEMS: ReadonlyArray<{ to: string; key: NavKey; end?: boolean }> = [
  { to: '/', key: 'explorer', end: true },
  { to: '/workspace', key: 'workspace' },
  { to: '/docs', key: 'docs' },
];

const REPO_URL = 'https://github.com/xto-ia/SPHEREx-explorer';

function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="flex items-center border border-line bg-black/40 font-mono text-[11px] leading-none transition-colors hover:border-line-hover"
    >
      <span aria-hidden="true" className="select-none px-1.5 text-zinc-600">
        [
      </span>
      {LANGUAGES.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && (
            <span aria-hidden="true" className="select-none px-0.5 text-zinc-700">
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            title={code === 'en' ? 'English' : 'Українська'}
            className={[
              'px-1.5 py-1.5 uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
              lang === code
                ? 'text-accent'
                : 'text-zinc-500 hover:text-zinc-200',
            ].join(' ')}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        </span>
      ))}
      <span aria-hidden="true" className="select-none px-1.5 text-zinc-600">
        ]
      </span>
    </div>
  );
}

export default function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label={`${t.nav.brand} ${t.nav.brandSuffix}`}
        >
          <img
            src="/brand/spherex-explorer-logo.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 select-none transition-transform duration-200 group-hover:scale-105"
          />
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-zinc-100">
              {t.nav.brand}
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-accent sm:inline">
              {t.nav.brandSuffix}
            </span>
          </span>
        </Link>

        <span aria-hidden="true" className="mx-1 hidden h-4 w-px bg-line md:block" />

        <nav aria-label={t.nav.navLabel} className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'relative px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                  isActive
                    ? 'text-zinc-100 after:absolute after:inset-x-3 after:-bottom-[15px] after:h-px after:bg-accent'
                    : 'text-zinc-500 hover:text-zinc-200',
                ].join(' ')
              }
            >
              {t.nav[item.key]}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            title={t.nav.github}
            aria-label={t.nav.github}
            className="grid h-7 w-7 place-items-center border border-line bg-black/40 text-zinc-500 transition-colors hover:border-line-hover hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Github size={13} strokeWidth={1.7} aria-hidden="true" />
          </a>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Compact navigation for narrow viewports */}
      <nav
        aria-label={t.nav.navLabel}
        className="flex w-full items-stretch border-t border-line/70 md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex-1 border-r border-line/70 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] transition-colors last:border-r-0',
                isActive
                  ? 'bg-accent/5 text-accent'
                  : 'text-zinc-500 hover:text-zinc-200',
              ].join(' ')
            }
          >
            {t.nav[item.key]}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
