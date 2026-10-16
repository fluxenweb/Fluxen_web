import Reveal from './Reveal';
import Lines from './Lines';
import PixelField from './PixelField';
import { useLocale } from '../i18n/LocaleContext';
import styles from './About.module.css';

export default function About() {
  const { t } = useLocale();
  const a = t.about;
  return (
    <section className={`${styles.section} shell`} aria-labelledby="about-title">
      <Reveal className={styles.top}>
        <h2 id="about-title" className={`${styles.title} display`}>
          <Lines lines={[a.title[0]]} />
          <span className={styles.indent}>
            <Lines lines={[a.title[1]]} start={1} />
          </span>
          <Lines lines={[a.title[2]]} start={2} />
        </h2>
        <div className={`${styles.field} rise`} style={{ '--i': 3 }}>
          <PixelField callout={a.callout} />
        </div>
      </Reveal>

      <Reveal className={styles.bottom}>
        <div className={styles.copy}>
          <p className={`${styles.lead} rise`}>
            {a.lead}
          </p>
          <p className={`${styles.body} rise`} style={{ '--i': 1 }}>
            {a.body}
          </p>
        </div>
        <dl className={styles.spec}>
          {a.spec.map(([k, v], i) => (
            <div key={k} className={styles.specRow}>
              <span className="rule" style={{ '--i': i }} />
              <dt className={`${styles.specKey} mono rise`} style={{ '--i': i }}>
                {k}
              </dt>
              <dd className={`${styles.specVal} rise`} style={{ '--i': i }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
