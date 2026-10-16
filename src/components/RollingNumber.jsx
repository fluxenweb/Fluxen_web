import styles from './RollingNumber.module.css';

const DIGITS = '0123456789';

/** Each digit spins up through a 0–9 strip when an ancestor gains `.is-in`. */
export default function RollingNumber({ value, className = '' }) {
  return (
    <span className={`${styles.number} ${className}`.trim()} aria-label={value}>
      {value.split('').map((char, i) => {
        const target = DIGITS.indexOf(char);
        // Group separators get a fixed gap so 4 990 000 reads clearly at any size.
        if (char === ' ') return <span key={i} className={styles.gap} />;
        if (target < 0) return <span key={i}>{char}</span>;
        return (
          <span key={i} className={styles.slot} aria-hidden="true">
            <span className={styles.strip} style={{ '--n': target, '--i': i }}>
              {DIGITS.split('').map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
