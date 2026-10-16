import { LogoMark, LogoType } from './Logo';
import styles from './Wordmark.module.css';

export default function Wordmark({ className = '' }) {
  return (
    <span className={`${styles.wordmark} ${className}`.trim()}>
      <LogoMark className={styles.mark} />
      <LogoType className={styles.type} strokeWidth={6.4} />
      <span className="visually-hidden">Fluxen Web Studio</span>
    </span>
  );
}
