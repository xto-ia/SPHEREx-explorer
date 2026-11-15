import { Layers, Orbit, ScanEye, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const MISSION_ICONS = [Sparkles, Orbit, Layers, ScanEye] as const;

export default function MissionBrief() {
  const { t } = useLanguage();

  const cards = [
    { title: t.home.cardBandsTitle, body: t.home.cardBandsBody },
    { title: t.home.cardSurveyTitle, body: t.home.cardSurveyBody },
    { title: t.home.cardArraysTitle, body: t.home.cardArraysBody },
    { title: t.home.cardDiscoveryTitle, body: t.home.cardDiscoveryBody },
  ];

  return (
    <section className="min-w-0" aria-labelledby="mission-title">
      <p className="kicker">{t.home.missionKicker}</p>
      <h2 id="mission-title" className="mt-2 max-w-2xl text-balance text-xl sm:text-2xl">
        {t.home.missionTitle}
      </h2>
      <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-zinc-500">{t.home.missionSubtitle}</p>

      <ul className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
        {cards.map((card, index) => {
          const Icon = MISSION_ICONS[index] ?? Sparkles;
          return (
            <li key={card.title} className="bg-canvas/90 p-5">
              <Icon size={16} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
              <h3 className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-100">
                {card.title}
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{card.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
