import { LOCALES, useLocale } from '../i18n/LocaleContext';
import styles from './LanguageSwitch.module.css';

const NAMES = { en: 'English', ru: 'Русский' };

export default function LanguageSwitch({ className = '' }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className={`${styles.switch} ${className}`.trim()} role="group" aria-label={t.nav.lang}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={`${styles.option} mono`}
          aria-pressed={locale === code}
          aria-label={NAMES[code]}
          onClick={() => setLocale(code)}
        >
          {code}
        </button>
      ))}
      <span className={styles.thumb} data-pos={LOCALES.indexOf(locale)} aria-hidden="true" />
    </div>
  );
}
