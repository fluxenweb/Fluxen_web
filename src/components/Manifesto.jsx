import { useRef, useState } from 'react';
import Reveal from './Reveal';
import { useScrollProgress } from '../hooks/useScrollProgress';
import styles from './Manifesto.module.css';

const LINES = [
  { text: 'Good design', align: 'l0' },
  { text: 'gets attention.', align: 'l1' },
  { text: 'Great digital', align: 'l2' },
  { text: 'experiences', align: 'l3' },
  { text: 'make people', align: 'l4' },
  { text: 'remember.', align: 'l5' },
];

const PRINCIPLES = [
  { a: 'Clarity', b: 'over clutter', note: 'If it does not help someone understand, it goes.' },
  { a: 'Purpose', b: 'over decoration', note: 'Every visual choice must earn its place.' },
  { a: 'Performance', b: 'by design', note: 'Speed is planned in the first sketch, not patched in at the end.' },
  { a: 'Details', b: 'matter', note: 'The last 5% is the part people feel.' },
];

const words = [];
LINES.forEach((line, li) =>
  line.text.split(' ').forEach((w) => words.push({ w, li })),
);
const TOTAL = words.length;

export default function Manifesto() {
  const track = useRef(null);
  const [pct, setPct] = useState(0);
  useScrollProgress(track, {
    start: 0,
    end: 1,
    onProgress: (p) => setPct((prev) => (Math.round(p * 100) === prev ? prev : Math.round(p * 100))),
  });

  let w = 0;
  return (
    <section className={styles.section} aria-labelledby="manifesto-title">
      <div ref={track} className={styles.track} style={{ '--n': TOTAL }}>
        <div className={`${styles.sticky} shell`}>
          <div className={`${styles.meta} mono`} aria-hidden="true">
            <span>(Manifesto)</span>
            <span className={styles.metaMid}>Studio / Philosophy</span>
            <span className={styles.metaPct}>
              <span className={styles.meter}>
                <span />
              </span>
              {String(pct).padStart(3, '0')}%
            </span>
          </div>

          <h2 id="manifesto-title" className={styles.statement}>
            {LINES.map((line, li) => (
              <span key={line.text} className={`${styles.line} ${styles[line.align]}`}>
                {line.text.split(' ').map((word) => {
                  const index = w++;
                  return (
                    <span key={word + index} className={styles.word} style={{ '--w': index }}>
                      {li === LINES.length - 1 ? word.replace('.', '') : word}
                      {li === LINES.length - 1 && <span className={styles.stop}>.</span>}{' '}
                    </span>
                  );
                })}
              </span>
            ))}
          </h2>

          <p className={`${styles.folio} mono`} aria-hidden="true">
            <span>FluxenWeb</span>
            <span>p. 03</span>
          </p>
        </div>
      </div>

      <Reveal as="ul" className={`${styles.principles} shell`} threshold={0.2}>
        {PRINCIPLES.map((p, i) => (
          <li key={p.a} className={styles.principle} style={{ '--i': i }}>
            <span className="rule" style={{ '--i': i }} />
            <p className={`${styles.pTitle} rise`} style={{ '--i': i }}>
              {p.a}
              <span className={styles.pSub}> {p.b}</span>
            </p>
            <p className={`${styles.pNote} rise`} style={{ '--i': i + 1 }}>
              {p.note}
            </p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
