import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';
import MobileMenu from './MobileMenu';
import { navLinks } from '../config/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useScrolled } from '../hooks/useScrolled';
import styles from './Navbar.module.css';

const ids = navLinks.map((l) => l.id);

/** Text that rolls up to a duplicate of itself on hover. */
export function Roll({ children }) {
  return (
    <span className={styles.roll}>
      <span className={styles.rollA}>{children}</span>
      <span className={styles.rollB} aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

export default function Navbar() {
  const scrolled = useScrolled(24);
  const active = useActiveSection(ids);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, visible: false });
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const link = active && list.querySelector(`[data-id="${active}"]`);
    if (!link) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    setIndicator({ x: link.offsetLeft, w: link.offsetWidth, visible: true });
  }, [active]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <>
      <header className={styles.nav} data-scrolled={scrolled || undefined}>
        <div className={`${styles.inner} shell`}>
          <a href="#top" className={styles.brand} aria-label="FluxenWeb — back to top">
            <Wordmark />
          </a>

          <nav aria-label="Primary" className={styles.primary}>
            <ul ref={listRef} className={styles.list}>
              {navLinks.map((link, i) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    data-id={link.id}
                    className={styles.link}
                    aria-current={active === link.id ? 'location' : undefined}
                  >
                    <span className={`${styles.index} mono`} aria-hidden="true">
                      0{i + 1}
                    </span>
                    <Roll>{link.label}</Roll>
                  </a>
                </li>
              ))}
            </ul>
            <span
              className={styles.indicator}
              aria-hidden="true"
              style={{
                transform: `translateX(${indicator.x}px) scaleX(${indicator.visible ? 1 : 0})`,
                width: indicator.w,
              }}
            />
          </nav>

          <a href="#contact" className={`${styles.cta} mono`}>
            <Roll>Let&rsquo;s talk</Roll>
            <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" className={styles.ctaIcon} />
          </a>

          <button
            type="button"
            className={`${styles.toggle} mono`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span>Menu</span>
            <span className={styles.burger} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} active={active} />
    </>
  );
}
