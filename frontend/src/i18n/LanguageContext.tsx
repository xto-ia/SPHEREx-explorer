import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  translations,
  type Dictionary,
  type Lang,
} from './translations';

interface LanguageContextValue {
  /** Active language code. */
  lang: Lang;
  /** Complete dictionary for the active language. */
  t: Dictionary;
  /** Switch to a specific language. */
  setLang: (lang: Lang) => void;
  /** Flip between English and Ukrainian. */
  toggleLang: () => void;
  /** Languages offered by the switcher, in display order. */
  languages: readonly Lang[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Reads the persisted preference; English is the default for first-time visitors. */
function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Private mode / disabled storage: fall back silently.
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Persisting is best-effort; the UI stays functional without it.
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === 'en' ? 'uk' : 'en';
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Keep the document in sync for screen readers, search engines and CSS.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Keep the browser tab title localized.
  useEffect(() => {
    document.title = translations[lang].meta.title;
  }, [lang]);

  // Cross-tab synchronisation: another tab switching language updates this one.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY || !isLang(event.newValue)) return;
      setLangState(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: translations[lang],
      setLang,
      toggleLang,
      languages: LANGUAGES,
    }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage() must be used inside a <LanguageProvider>.');
  }
  return context;
}
