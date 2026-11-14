import { Link } from 'react-router-dom';
import { RadioTower } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto grid w-full max-w-[1600px] place-items-center px-4 py-24 sm:px-6">
      <div className="w-full max-w-md border border-line bg-surface p-8 text-center backdrop-blur-md">
        <RadioTower size={22} strokeWidth={1.3} className="mx-auto text-accent" aria-hidden="true" />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          {t.notFound.code}
        </p>
        <h1 className="mt-2 text-xl">{t.notFound.title}</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{t.notFound.body}</p>
        <Link to="/" className="btn-primary mt-6">
          {t.notFound.action}
        </Link>
      </div>
    </div>
  );
}
