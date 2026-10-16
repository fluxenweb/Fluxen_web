import { useCallback, useEffect, useState } from 'react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Pricing from './components/Pricing';
import Services from './components/Services';
import Manifesto from './components/Manifesto';
import Process from './components/Process';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useLocale } from './i18n/LocaleContext';

export default function App() {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);

  // Hidden detail: press G to toggle the 12-column layout grid.
  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]')) return;
      if (event.key === 'g' || event.key === 'G') document.documentElement.classList.toggle('show-grid');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  
  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <div className="atmosphere" aria-hidden="true">
        <div className="atmosphere__grid">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))} 
        </div>
        <div className="atmosphere__grain" />
      </div>
      <Loader onDone={onLoaded} />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero ready={ready} />
        <Pricing />
        <Services />
        <div id="studio">
          <Manifesto />
          <Process />
          <About />
        </div>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
