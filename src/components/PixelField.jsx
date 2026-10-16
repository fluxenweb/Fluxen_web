import { useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import styles from './PixelField.module.css';

const COLS = 24;
const ROWS = 14;
const TARGET = 6 * COLS + 6;

/** A field of pixels. Move across it and each cell flashes, then settles. One pixel is always lit. */
export default function PixelField({ callout }) {
  const ref = useRef(null);
  const last = useRef(-1);

  const onMove = (event) => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * COLS);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * ROWS);
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
    const index = row * COLS + col;
    if (index === last.current || index === TARGET) return;
    last.current = index;
    const cell = el.children[index];
    cell?.animate(
      [
        { backgroundColor: '#5b5cff', transform: 'scale(1)' },
        { backgroundColor: '#f2f3ff', transform: 'scale(0.85)', offset: 0.25 },
        { backgroundColor: '#12152a', transform: 'scale(1)' },
      ],
      { duration: 1100, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  };

  return (
    <div className={styles.wrap} aria-hidden="true">
      <div ref={ref} className={styles.field} style={{ '--cols': COLS }} onPointerMove={onMove}>
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} className={i === TARGET ? styles.target : undefined} />
        ))}
      </div>
      <span className={`${styles.callout} mono`} style={{ '--x': (6.5 / COLS) * 100, '--y': (6.5 / ROWS) * 100 }}>
        <span className={styles.calloutLine} />
        <span className={styles.calloutText}>{callout}</span>
      </span>
      <span className={`${styles.axis} ${styles.axisX} mono`}>
        <span>000</span>
        <span>{String(COLS).padStart(3, '0')}</span>
      </span>
      <span className={`${styles.axis} ${styles.axisY} mono`}>
        <span>000</span>
        <span>{String(ROWS).padStart(3, '0')}</span>
      </span>
    </div>
  );
}
