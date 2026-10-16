import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { projects } from '../data/projects';
import ProjectPreview from './ProjectPreview';
import { useLockBody } from '../hooks/useLockBody';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { scrollToId } from '../utils/scroll';
import styles from './ProjectModal.module.css';

/**
 * Case-study overlay built on the native <dialog> element, which provides the
 * focus trap, Escape handling and inert background for free. We add animated
 * open/close and prev/next navigation between concept projects.
 */
export default function ProjectModal({ project, onClose, onNavigate }) {
  const dialog = useRef(null);
  const scroller = useRef(null);
  const [closing, setClosing] = useState(false);
  const [current, setCurrent] = useState(project);
  useLockBody(Boolean(project));

  useEffect(() => {
    if (project) setCurrent(project);
  }, [project]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (project && !el.open) {
      el.showModal();
      setClosing(false);
    }
  }, [project]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [current]);

  const requestClose = () => {
    if (closing) return;
    if (prefersReducedMotion()) {
      dialog.current?.close();
      onClose();
      return;
    }
    setClosing(true);
  };

  const onAnimationEnd = (event) => {
    if (closing && event.target === dialog.current) {
      dialog.current.close();
      setClosing(false);
      onClose();
    }
  };

  const onCancel = (event) => {
    event.preventDefault();
    requestClose();
  };

  const startProject = (event) => {
    event.preventDefault();
    dialog.current?.close();
    setClosing(false);
    onClose();
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToId('contact')));
  };

  const idx = current ? projects.findIndex((p) => p.id === current.id) : 0;
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-closing={closing || undefined}
      aria-labelledby="case-title"
      onCancel={onCancel}
      onAnimationEnd={onAnimationEnd}
      onClick={(e) => e.target === dialog.current && requestClose()}
    >
      {current && (
        <div
          ref={scroller}
          className={styles.panel}
          style={{ '--p-bg': current.theme.bg, '--p-fg': current.theme.fg, '--p-accent': current.theme.accent }}
        >
          <div className={`${styles.bar} mono`}>
            <span>
              Case {current.index} / 0{projects.length}
              <span className={styles.badge}>Concept project</span>
            </span>
            <button type="button" className={styles.close} onClick={requestClose} autoFocus>
              Close
              <X size={16} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>

          <header className={styles.head} key={current.id}>
            <p className={`${styles.cat} mono`}>
              {current.category} <span className="muted">/ {current.year}</span>
            </p>
            <h2 id="case-title" className={styles.name}>
              {current.name}
            </h2>
            <p className={styles.tagline}>{current.tagline}</p>
          </header>

          <div className={styles.visual}>
            <div className={styles.visualFrame} style={{ '--aspect': current.aspect }}>
              <ProjectPreview id={current.id} className="preview-static" key={current.id} />
            </div>
            <span className={`${styles.visualNote} mono`}>Concept frame / {current.name}</span>
          </div>

          <div className={styles.body}>
            <section className={styles.block}>
              <h3 className={`${styles.label} mono`}>Overview</h3>
              <p className={styles.lead}>{current.summary}</p>
            </section>
            <section className={styles.block}>
              <h3 className={`${styles.label} mono`}>The challenge</h3>
              <p>{current.challenge}</p>
            </section>
            <section className={styles.block}>
              <h3 className={`${styles.label} mono`}>Approach</h3>
              <ol className={styles.steps}>
                {current.approach.map((item, i) => (
                  <li key={item}>
                    <span className="mono muted">{String(i + 1).padStart(2, '0')}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
            <aside className={styles.facts}>
              <div>
                <h3 className={`${styles.label} mono`}>Scope</h3>
                <ul>
                  {current.scope.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={`${styles.label} mono`}>Stack</h3>
                <ul>
                  {current.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <p className={`${styles.disclaimer} mono`}>
                Self-initiated concept. Not a client engagement; names and figures are illustrative.
              </p>
            </aside>
          </div>

          <nav className={styles.pager} aria-label="Other case studies">
            <button type="button" className={styles.pageBtn} onClick={() => onNavigate(prev)}>
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <span className="mono muted">Previous</span>
                {prev.name}
              </span>
            </button>
            <a href="#contact" className={styles.start} onClick={startProject}>
              Start a similar project
              <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <button type="button" className={`${styles.pageBtn} ${styles.pageNext}`} onClick={() => onNavigate(next)}>
              <span>
                <span className="mono muted">Next</span>
                {next.name}
              </span>
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </dialog>
  );
}
