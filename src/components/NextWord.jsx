import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import styles from './NextWord.module.css';

/**
 * "NEXT." is set in outline; a solid lime copy is revealed through a soft
 * circular mask that follows the pointer. Without a pointer (touch, idle) the
 * mask drifts on its own along a slow Lissajous path.
 */
export default function NextWord({ text }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    let lastPointer = -Infinity;
    let raf = 0;
    let visible = true;
    const pos = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const onMove = (event) => {
      if (event.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      pos.tx = (event.clientX - rect.left) / rect.width;
      pos.ty = (event.clientY - rect.top) / rect.height;
      lastPointer = performance.now();
    };

    const tick = (now) => {
      if (now - lastPointer > 2600) {
        const t = now / 1000;
        pos.tx = 0.5 + Math.sin(t * 0.55) * 0.42;
        pos.ty = 0.5 + Math.sin(t * 0.9 + 1.2) * 0.28;
      }
      pos.x += (pos.tx - pos.x) * 0.12;
      pos.y += (pos.ty - pos.y) * 0.12;
      el.style.setProperty('--mx', `${(pos.x * 100).toFixed(2)}%`);
      el.style.setProperty('--my', `${(pos.y * 100).toFixed(2)}%`);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <span ref={ref} className={styles.word}>
      <span className={styles.outline}>{text}</span>
      <span className={styles.fill}>{text}</span>
      <span className={styles.caret} />
    </span>
  );
}
