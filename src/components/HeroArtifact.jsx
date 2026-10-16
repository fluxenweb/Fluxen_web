import { useEffect, useRef, useState } from 'react';
import { subscribe } from '../hooks/scrollLoop';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import styles from './HeroArtifact.module.css';

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/**
 * Lazy-loads the Three.js scene so it never blocks first paint. Until it is
 * ready — or if WebGL is unavailable — a CSS/SVG stand-in holds the space.
 */
export default function HeroArtifact({ onFrame }) {
  const mount = useRef(null);
  const frameCb = useRef(onFrame);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    frameCb.current = onFrame;
  });

  useEffect(() => {
    if (!supportsWebGL()) {
      setStatus('fallback');
      return undefined;
    }
    let artifact;
    let cancelled = false;
    const cleanups = [];

    import('./artifact/scene.js')
      .then(({ createArtifact }) => {
        if (cancelled || !mount.current) return;
        const container = mount.current;
        artifact = createArtifact(container, {
          reducedMotion: prefersReducedMotion(),
          onFrame: (data) => frameCb.current && frameCb.current(data),
        });
        setStatus('ready');

        const onPointer = (event) => {
          const x = (event.clientX / window.innerWidth) * 2 - 1;
          const y = -((event.clientY / window.innerHeight) * 2 - 1);
          artifact.setPointer(x, y);
        };
        window.addEventListener('pointermove', onPointer, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', onPointer));

        cleanups.push(
          subscribe(() => {
            const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
            artifact.setScroll(p);
          }),
        );

        // Only animate while visible and the tab is active.
        let visible = true;
        const sync = () => (visible && !document.hidden ? artifact.start() : artifact.stop());
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        });
        io.observe(container);
        document.addEventListener('visibilitychange', sync);
        cleanups.push(() => {
          io.disconnect();
          document.removeEventListener('visibilitychange', sync);
        });
      })
      .catch(() => !cancelled && setStatus('fallback'));

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      if (artifact) artifact.dispose();
    };
  }, []);

  return (
    <div className={styles.artifact} data-status={status} aria-hidden="true">
      <div className={styles.fallback}>
        <svg viewBox="0 0 400 400" className={styles.fallbackSvg}>
          <defs>
            <radialGradient id="fw-core" cx="38%" cy="34%" r="70%">
              <stop offset="0" stopColor="#c9cdf5" />
              <stop offset="0.45" stopColor="#2a2fb8" />
              <stop offset="1" stopColor="#020308" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="132" fill="url(#fw-core)" />
          <ellipse cx="200" cy="200" rx="188" ry="64" fill="none" stroke="#f2f3ff" strokeOpacity="0.25" transform="rotate(-24 200 200)" />
          <circle cx="352" cy="148" r="4" fill="#8f90ff" />
        </svg>
      </div>
      <div ref={mount} className={styles.canvas} />
    </div>
  );
}
