import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { navLinks, site } from '../config/site';
import { useInView } from '../hooks/useInView';
import { scrollToId } from '../utils/scroll';
import { LogoMark, LogoType } from './Logo';
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
  const ref = useRef(null);
  const end = useRef(null);
  const inView = useInView(ref, { threshold: 0.2 });
  const reachedEnd = useInView(end, { threshold: 1, rootMargin: '0px' });
  const year = new Date().getFullYear();

  return (
    <footer ref={ref} className={`${styles.footer} ${inView ? 'is-in' : ''}`} data-end={reachedEnd || undefined}>
      <div className={`${styles.top} shell`}>
        <div className={styles.statement}>
          <p className={styles.big}>We build what&rsquo;s next.</p>
          <p className={styles.small}>
            An independent digital studio crafting websites, products and interactive experiences with precision and
            intent.
          </p>
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h2 className={`${styles.colTitle} mono`}>Index</h2>
          <ul>
            {navLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className={styles.link}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={`${styles.colTitle} mono`}>Elsewhere</h2>
          <ul>
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className={styles.link} target="_blank" rel="noreferrer noopener">
                  {s.label}
                  <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h2 className={`${styles.colTitle} mono`}>Contact</h2>
          <a href={`mailto:${site.email}`} className={`${styles.link} ${styles.mail}`}>
            {site.email}
          </a>
          <button type="button" className={`${styles.top_btn} mono`} onClick={() => scrollToId('top')}>
            <span className={styles.topIcon}>
              <ArrowUp size={14} strokeWidth={1.6} aria-hidden="true" />
            </span>
            Back to top
          </button>
        </div>
      </div>

      <div className={styles.markWrap} aria-hidden="true">
        <p className={`${styles.secret} mono`}>You made it to the very end. Press G to see the grid we built on.</p>
        <div className={styles.mark}>
          <LogoMark className={styles.bigMark} />
          <div className={styles.typeCol}>
            <LogoType className={styles.bigType} letterClassName={styles.letter} strokeWidth={5.6} />
            <span className={`${styles.studio} mono`}>Web studio</span>
          </div>
        </div>
      </div>

      <div ref={end} className={`${styles.bottom} shell mono`}>
        <span>© {year} Fluxen Web Studio. All rights reserved.</span>
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          Studio online · your time <Clock />
        </span>
        <span className={styles.made}>Designed &amp; built in-house</span>
      </div>
    </footer>
  );
}
