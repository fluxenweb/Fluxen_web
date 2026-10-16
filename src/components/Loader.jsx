import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import Wordmark from './Wordmark';
import styles from './Loader.module.css';

const MIN_MS = 1100;
const MAX_MS = 2600;

/** Short entrance: counts to 100 while fonts load, then lifts away to start the hero reveal. */
export default function Loader({ onDone }) {
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? 'done' : 'loading'));
  const count = useRef(null);
  const bar = useRef(null);

  useEffect(() => {
    if (phase === 'done') {
      onDone();
      return undefined;
    }
    if (phase !== 'loading') return undefined;

    let fontsReady = !document.fonts;
    document.fonts?.ready.then(() => {
      fontsReady = true;
    });
    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / MIN_MS);
      let value = (1 - (1 - t) ** 3) * 100;
      if (!fontsReady && elapsed < MAX_MS) value = Math.min(value, 94);
      if (count.current) count.current.textContent = String(Math.round(value)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${value / 100})`;
      if (t >= 1 && (fontsReady || elapsed >= MAX_MS)) {
        setPhase('leaving');
        onDone();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, onDone]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timeout = setTimeout(() => setPhase('done'), 1100);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={styles.loader} data-phase={phase} aria-hidden="true">
      <div className={`${styles.top} mono`}>
        <Wordmark />
        <span>Independent digital studio</span>
      </div>
      <div className={styles.center}>
        <span className={styles.count} ref={count}>
          000
        </span>
        <span className={styles.track}>
          <span ref={bar} className={styles.bar} />
        </span>
      </div>
      <div className={`${styles.bottom} mono`}>
        <span>Loading dimension</span>
        <span>We build what&rsquo;s next.</span>
      </div>
    </div>
  );
}
