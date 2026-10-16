import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';
import MobileMenu from './MobileMenu';
import LanguageSwitch from './LanguageSwitch';
import { useLocale } from '../i18n/LocaleContext';
import { navLinks } from '../config/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useScrolled } from '../hooks/useScrolled';
import styles from './Navbar.module.css';

const ids = navLinks;

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
  const { t, locale } = useLocale();
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

  // Re-measure when the language changes, since link widths change with it.
  useLayoutEffect(measure, [measure, locale]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <>
      <header className={styles.nav} data-scrolled={scrolled || undefined}>
        <div className={`${styles.inner} shell`}>
          <a href="#top" className={styles.brand} aria-label={t.nav.home}>
            <Wordmark />
          </a>

          <nav aria-label={t.nav.primary} className={styles.primary}>
            <ul ref={listRef} className={styles.list}>
              {navLinks.map((id, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    data-id={id}
                    className={styles.link}
                    aria-current={active === id ? 'location' : undefined}
                  >
                    <span className={`${styles.index} mono`} aria-hidden="true">
                      0{i + 1}
                    </span>
                    <Roll>{t.nav.links[id]}</Roll>
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

          <LanguageSwitch className={styles.lang} />

          <a href="#contact" className={`${styles.cta} mono`}>
            <Roll>{t.nav.cta}</Roll>
            <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" className={styles.ctaIcon} />
          </a>

          <button
            type="button"
            className={`${styles.toggle} mono`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span>{t.nav.menu}</span>
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
