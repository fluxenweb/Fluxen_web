import { useEffect, useRef } from 'react';
import { subscribe } from './scrollLoop';

/**
 * Writes the element's scroll progress (0 → 1) to a CSS custom property and
 * optionally calls `onProgress`. Progress is 0 when the element's top reaches
 * `start` (fraction of viewport height) and 1 when its bottom reaches `end`.
 */
export function useScrollProgress(ref, { variable = '--progress', start = 1, end = 0, onProgress } = {}) {
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return subscribe(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const from = vh * start;
      const to = vh * end;
      const total = rect.height + from - to;
      const raw = total > 0 ? (from - rect.top) / total : 0;
      const p = Math.min(1, Math.max(0, raw));
      el.style.setProperty(variable, p.toFixed(4));
      if (callback.current) callback.current(p);
    });
  }, [ref, variable, start, end]);
}
