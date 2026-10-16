import styles from './ServiceGlyph.module.css';

/** Small drawn glyphs, one per discipline. They animate when the row is hovered or open. */
const glyphs = {
  strategy: (
    <>
      <circle cx="32" cy="32" r="22" className={styles.dash} />
      <circle cx="32" cy="32" r="11" />
      <path d="M32 4v14M32 46v14M4 32h14M46 32h14" />
      <circle cx="32" cy="32" r="3" className={styles.fillAccent} />
    </>
  ),
  design: (
    <>
      <path d="M10 50 C 18 14, 46 50, 54 14" className={styles.draw} pathLength="1" />
      <path d="M10 50 L22 26 M54 14 L42 38" className={styles.thin} />
      <rect x="7" y="47" width="6" height="6" />
      <rect x="51" y="11" width="6" height="6" className={styles.fillAccent} />
      <circle cx="22" cy="26" r="2.5" />
      <circle cx="42" cy="38" r="2.5" />
    </>
  ),
  development: (
    <>
      <path d="M22 18 L8 32 L22 46" className={styles.left} />
      <path d="M42 18 L56 32 L42 46" className={styles.right} />
      <path d="M36 12 L28 52" className={styles.accentStroke} />
    </>
  ),
  ecommerce: (
    <>
      <path d="M14 22 H50 L46 54 H18 Z" />
      <path d="M24 22 V16 a8 8 0 0 1 16 0 V22" className={styles.handle} />
      <path d="M22 34 H42" className={styles.accentStroke} />
    </>
  ),
  apps: (
    <>
      <rect x="8" y="8" width="20" height="28" />
      <rect x="34" y="8" width="22" height="14" className={styles.fillAccentRect} />
      <rect x="34" y="28" width="22" height="28" />
      <rect x="8" y="42" width="20" height="14" />
    </>
  ),
  motion: (
    <>
      <path d="M4 32 C 14 8, 22 8, 32 32 S 50 56, 60 32" className={styles.draw} pathLength="1" />
      <circle r="4" className={`${styles.fillAccent} ${styles.traveller}`} />
    </>
  ),
};

export default function ServiceGlyph({ name }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 64 64" aria-hidden="true" data-glyph={name}>
      {glyphs[name]}
    </svg>
  );
}
