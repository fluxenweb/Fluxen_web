import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { navLinks, site } from '../config/site';
import { useInView } from '../hooks/useInView';
import { scrollToId } from '../utils/scroll';
import { LogoMark, LogoType } from './Logo';
import { useLocale } from '../i18n/LocaleContext';
import styles from './Footer.module.css';

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time dateTime={now.toISOString()} className={styles.clock}>
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </time>
  );
}

export default function Footer() {
  const { t } = useLocale();
  const f = t.footer;
  const ref = useRef(null);
  const end = useRef(null);
  const inView = useInView(ref, { threshold: 0.2 });
  const reachedEnd = useInView(end, { threshold: 1, rootMargin: '0px' });
  const year = new Date().getFullYear();

  return (
    <footer ref={ref} className={`${styles.footer} ${inView ? 'is-in' : ''}`} data-end={reachedEnd || undefined}>
      <div className={`${styles.top} shell`}>
        <div className={styles.statement}>
          <p className={styles.big}>{f.statement}</p>
          <p className={styles.small}>
            {f.small}
          </p>
        </div>

        <nav className={styles.col} aria-label={f.index}>
          <h2 className={`${styles.colTitle} mono`}>{f.index}</h2>
          <ul>
            {navLinks.map((id) => (
              <li key={id}>
                <a href={`#${id}`} className={styles.link}>
                  {t.nav.links[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={`${styles.colTitle} mono`}>{f.elsewhere}</h2>
          <ul>
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className={styles.link} target="_blank" rel="noreferrer noopener">
                  {s.label}
                  <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  <span className="visually-hidden">{f.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h2 className={`${styles.colTitle} mono`}>{f.contact}</h2>
          <a href={`mailto:${site.email}`} className={`${styles.link} ${styles.mail}`}>
            {site.email}
          </a>
          <button type="button" className={`${styles.top_btn} mono`} onClick={() => scrollToId('top')}>
            <span className={styles.topIcon}>
              <ArrowUp size={14} strokeWidth={1.6} aria-hidden="true" />
            </span>
            {f.top}
          </button>
        </div>
      </div>

      <div className={styles.markWrap} aria-hidden="true">
        <p className={`${styles.secret} mono`}>{f.secret}</p>
        <div className={styles.mark}>
          <LogoMark className={styles.bigMark} />
          <div className={styles.typeCol}>
            <LogoType className={styles.bigType} letterClassName={styles.letter} strokeWidth={5.6} />
            <span className={`${styles.studio} mono`}>{f.studio}</span>
          </div>
        </div>
      </div>

      <div ref={end} className={`${styles.bottom} shell mono`}>
        <span>{f.rights(year)}</span>
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          {f.status} <Clock />
        </span>
        <span className={styles.made}>{f.made}</span>
      </div>
    </footer>
  );
}
