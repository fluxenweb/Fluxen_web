import { useEffect, useMemo, useState } from 'react';
import { LOCALES, LocaleContext } from './LocaleContext';
import en from './en';
import ru from './ru';

const dictionaries = { en, ru };
const STORAGE_KEY = 'fluxen-locale';

/** URL (?lang=ru) wins, then the visitor's saved choice, then the browser language. */
function initialLocale() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (LOCALES.includes(fromUrl)) return fromUrl;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (LOCALES.includes(saved)) return saved;
  } catch {
    /* storage can be unavailable (private mode); fall through */
  }
  const langs = navigator.languages || [navigator.language];
  return langs.some((l) => /^(ru|uk|be|kk)\b/i.test(l || '')) ? 'ru' : 'en';
}

export default function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);
  const t = dictionaries[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, t]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
