import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';
import { navLinks, site } from '../config/site';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLockBody } from '../hooks/useLockBody';
import { scrollToId } from '../utils/scroll';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ open, onClose, active }) {
  const panel = useRef(null);
  const closeBtn = useRef(null);
  useFocusTrap(panel, open, onClose);
  useLockBody(open);

  const go = (event, id) => {
    event.preventDefault();
    onClose();
    // Wait for the scroll lock to release before scrolling.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
  };

  return (
    <div
      id="mobile-menu"
      ref={panel}
      className={styles.menu}
      data-open={open || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={open ? undefined : ''}
      onTransitionEnd={(e) => {
        if (open && e.target === panel.current) closeBtn.current?.focus();
      }}
    >
      <div className={`${styles.top} shell`}>
        <a href="#top" className={styles.brand} onClick={(e) => go(e, 'top')}>
          <Wordmark />
        </a>
        <button ref={closeBtn} type="button" className={`${styles.close} mono`} onClick={onClose}>
          <span>Close</span>
          <span className={styles.x} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Mobile" className={`${styles.body} shell`}>
        <ul className={styles.list}>
          {navLinks.map((link, i) => (
            <li key={link.id} className={styles.item} style={{ '--i': i }}>
              <a
                href={`#${link.id}`}
                className={styles.link}
                aria-current={active === link.id ? 'location' : undefined}
                onClick={(e) => go(e, link.id)}
              >
                <span className={`${styles.num} mono`}>0{i + 1}</span>
                <span className={styles.label}>{link.label}</span>
                <ArrowUpRight className={styles.arrow} size={28} strokeWidth={1.2} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`${styles.foot} shell`}>
        <a href={`mailto:${site.email}`} className={styles.mail}>
          {site.email}
        </a>
        <ul className={`${styles.socials} mono`}>
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className={`${styles.status} mono`}>
          <span className={styles.dot} aria-hidden="true" />
          {site.availability}
        </p>
      </div>
    </div>
  );
}
