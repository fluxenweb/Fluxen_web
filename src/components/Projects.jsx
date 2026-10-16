import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '../data/projects';
import ProjectPreview from './ProjectPreview';
import ProjectModal from './ProjectModal';
import RollingNumber from './RollingNumber';
import Reveal from './Reveal';
import Lines from './Lines';
import { useScrollProgress } from '../hooks/useScrollProgress';
import styles from './Projects.module.css';

function ProjectCard({ project, onOpen, onHover }) {
  const ref = useRef(null);
  useScrollProgress(ref, { variable: '--progress' });

  const onMove = (event) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--cx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--cy', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--lx', (x * 2 - 1).toFixed(3));
  };

  return (
    <Reveal
      as="article"
      className={`project-card ${styles.card} ${styles[project.id]}`}
      threshold={0.08}
      onPointerMove={onMove}
      onPointerEnter={() => onHover(project)}
      onPointerLeave={() => onHover(null)}
    >
      <div ref={ref} className={styles.media} style={{ '--aspect': project.aspect }}>
        <div className={`${styles.mediaInner} wipe`}>
          <div className={styles.parallax}>
            <ProjectPreview id={project.id} />
          </div>
        </div>
      </div>
      <div className={styles.meta}>
        <span className={`${styles.num} mono`}>
          <RollingNumber value={project.index} />
          <span className="muted">&nbsp;/ 04</span>
        </span>
        <h3 className={styles.name}>{project.name}</h3>
        <p className={styles.tagline}>{project.tagline}</p>
        <dl className={`${styles.facts} mono`}>
          <div>
            <dt className="visually-hidden">Category</dt>
            <dd>{project.category}</dd>
          </div>
          <div>
            <dt className="visually-hidden">Year</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>
      </div>
      <button type="button" className={styles.hit} onClick={(e) => onOpen(project, e.currentTarget)}>
        <span className="visually-hidden">Open the {project.name} concept case study</span>
      </button>
    </Reveal>
  );
}

/** Label that trails the cursor while over a project (fine pointers only). */
function CursorLabel({ project }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (project) setShown(project);
  }, [project]);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const pos = { x: -200, y: -200, tx: -200, ty: -200 };
    let raf = 0;
    const onMove = (e) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      pos.x += (pos.tx - pos.x) * 0.2;
      pos.y += (pos.ty - pos.y) * 0.2;
      if (ref.current) ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      <span className={`${styles.cursorInner} mono`} data-visible={project ? true : undefined}>
        <span className={styles.cursorDot} />
        View case {shown ? shown.index : ''}
        <ArrowUpRight size={13} strokeWidth={1.6} />
      </span>
    </div>
  );
}

export default function Projects() {
  const [open, setOpen] = useState(null);
  const [hovered, setHovered] = useState(null);
  const opener = useRef(null);

  const onOpen = useCallback((project, trigger) => {
    opener.current = trigger;
    setOpen(project);
  }, []);
  const onClose = useCallback(() => {
    setOpen(null);
    opener.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section id="work" className={`${styles.section} shell`} aria-labelledby="work-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="work-title" className={`${styles.title} display`}>
          <Lines lines={['Selected /']} />
          <span className={styles.titleIndent}>
            <Lines lines={['Work']} start={1} />
          </span>
        </h2>
        <div className={styles.intro}>
          <span className="rule" />
          <p className={`${styles.lede} rise`} style={{ '--i': 2 }}>
            Different challenges. Distinct digital experiences.
          </p>
          <p className={`${styles.note} rise mono`} style={{ '--i': 3 }}>
            <span className="accent">(04)</span> Concept projects, 2025–2026. Self-initiated studies, not client work.
          </p>
        </div>
      </Reveal>

      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={onOpen} onHover={setHovered} />
        ))}
        <Reveal className={styles.slot}>
          <p className={`${styles.slotLabel} mono rise`}>05 / Open slot</p>
          <p className={`${styles.slotText} rise`} style={{ '--i': 1 }}>
            The next case study could be yours.
          </p>
          <a href="#contact" className={`${styles.slotLink} rise`} style={{ '--i': 2 }}>
            Start a project
            <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </Reveal>
      </div>

      <CursorLabel project={hovered} />
      <ProjectModal project={open} onClose={onClose} onNavigate={setOpen} />
    </section>
  );
}
