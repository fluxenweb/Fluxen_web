import { useCallback, useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import HeroArtifact from './HeroArtifact';
import NextWord from './NextWord';
import Lines from './Lines';
import { useLocale } from '../i18n/LocaleContext';
import { subscribe } from '../hooks/scrollLoop';
import styles from './Hero.module.css';

const pad = (n, len = 4) => String(Math.max(0, Math.round(n))).padStart(len, '0');
const deg = (rad) => (((rad * 180) / Math.PI) % 360 + 360) % 360;

export default function Hero({ ready }) {
  const { t } = useLocale();
  const h = t.hero;
  const section = useRef(null);
  const coordX = useRef(null);
  const coordY = useRef(null);
  const rotX = useRef(null);
  const rotY = useRef(null);
  const fluxBar = useRef(null);

  // Live pointer readout — a small technical annotation that responds to the visitor.
  useEffect(() => {
    const onMove = (event) => {
      if (coordX.current) coordX.current.textContent = pad(event.clientX);
      if (coordY.current) coordY.current.textContent = pad(event.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Light parallax: the hero drifts apart as it leaves the viewport.
  useEffect(() => {
    const el = section.current;
    return subscribe(() => {
      const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      el.style.setProperty('--hero-p', p.toFixed(4));
    });
  }, []);

  const onFrame = useCallback(({ rx, ry, flux }) => {
    if (rotX.current) rotX.current.textContent = deg(rx).toFixed(1).padStart(5, '0');
    if (rotY.current) rotY.current.textContent = deg(ry).toFixed(1).padStart(5, '0');
    if (fluxBar.current) fluxBar.current.style.transform = `scaleX(${Math.min(1, 0.08 + flux).toFixed(3)})`;
  }, []);

  return (
    <section id="top" ref={section} className={`${styles.hero} ${ready ? 'is-in' : ''}`} aria-labelledby="hero-title">
      <span className={`${styles.arc} ${styles.arcA}`} aria-hidden="true" />
      <span className={`${styles.arc} ${styles.arcB}`} aria-hidden="true" />
      <div className={styles.artifactWrap}>
        <HeroArtifact onFrame={onFrame} />
        <div className={styles.frame} aria-hidden="true">
          <span className={`${styles.frameLabel} ${styles.tl} mono`}>{h.fig}</span>
          <span className={`${styles.frameLabel} ${styles.br} mono`}>
            <span>
              RX <span ref={rotX}>000.0</span>° &nbsp;RY <span ref={rotY}>000.0</span>°
            </span>
          </span>
          <span className={`${styles.frameLabel} ${styles.bl} mono`}>
            {h.flux}
            <span className={styles.fluxTrack}>
              <span ref={fluxBar} className={styles.fluxBar} />
            </span>
          </span>
        </div>
      </div>

      <div className={`${styles.topRow} shell`}>
        <p className={`${styles.meta} rise mono`} style={{ '--i': 4 }}>
          <span className={styles.metaKey}>{h.locationKey}</span>
          {h.location}
        </p>
        <p className={`${styles.meta} ${styles.metaTag} rise mono`} style={{ '--i': 5 }}>
          <span className={styles.metaKey}>{h.indexKey}</span>
          {h.tagline}
        </p>
        <p className={`${styles.meta} ${styles.metaCoords} rise mono`} style={{ '--i': 6 }} aria-hidden="true">
          <span className={styles.metaKey}>{h.cursor}</span>
          <span>
            X <span ref={coordX}>0000</span> &nbsp;Y <span ref={coordY}>0000</span>
          </span>
        </p>
      </div>

      <h1 id="hero-title" className={`${styles.title} shell`}>
        <span className="visually-hidden">{h.srTitle}</span>
        <span aria-hidden="true" className={styles.titleLines}>
          <span className={styles.l1}>
            <Lines lines={[h.lines[0]]} />
          </span>
          <span className={styles.l2}>
            <Lines lines={[h.lines[1]]} start={1} />
          </span>
          <span className={`${styles.l3} line`}>
            <span className="line__inner" style={{ '--i': 2 }}>
              <NextWord text={h.word} />
            </span>
          </span>
        </span>
      </h1>

      <div className={`${styles.bottomRow} shell`}>
        <p className={`${styles.intro} rise`} style={{ '--i': 7 }}>
          {h.intro}
        </p>
        <p className={`${styles.status} rise mono`} style={{ '--i': 8 }}>
          <span className={styles.dot} aria-hidden="true" />
          <span>
            <span className={styles.statusKey}>{h.statusKey}</span>
            {t.availability}
          </span>
        </p>
        <a href="#pricing" className={`${styles.scroll} rise mono`} style={{ '--i': 9 }}>
          <span className={styles.scrollTrack} aria-hidden="true">
            <span className={styles.scrollThumb} />
          </span>
          <span>{h.scroll}</span>
          <ArrowDown size={14} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
