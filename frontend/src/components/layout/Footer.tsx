import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const REPO_URL = 'https://github.com/xto-ia/SPHEREx-explorer';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 border-t border-line bg-canvas/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            {t.footer.builtFor}
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-zinc-500">{t.footer.tagline}</p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            {t.footer.dataSources}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/docs"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              {t.nav.docs}
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-accent"
            >
              <Github size={11} aria-hidden="true" />
              GitHub
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700">
              {t.footer.rights}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
