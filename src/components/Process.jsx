import { useRef, useState } from 'react';
import Reveal from './Reveal';
import Lines from './Lines';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useLocale } from '../i18n/LocaleContext';
import styles from './Process.module.css';

/* A single composition that evolves from scattered thought (01) to finished pixel (04). */
function StageVisual({ step }) {
  const dots = [
    [14, 18], [38, 58], [62, 24], [88, 64], [104, 14], [24, 66], [74, 44], [50, 10],
  ];
  return (
    <svg className={styles.visual} viewBox="0 0 120 80" aria-hidden="true" data-step={step}>
      {step === 0 &&
        dots.map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="4" className={i === 6 ? styles.lime : styles.ink} />)}
      {step === 1 && (
        <>
          <rect x="6" y="6" width="108" height="14" className={styles.wire} />
          <rect x="6" y="26" width="64" height="48" className={styles.wire} />
          <rect x="76" y="26" width="38" height="22" className={styles.wire} />
          <rect x="76" y="54" width="38" height="20" className={styles.wire} />
          <path d="M6 26 L70 74 M70 26 L6 74" className={styles.wireThin} />
          <rect x="72" y="22" width="4" height="4" className={styles.lime} />
        </>
      )}
      {step === 2 && (
        <>
          <rect x="6" y="6" width="108" height="14" className={styles.solid} />
          <rect x="6" y="26" width="64" height="48" className={styles.solidDim} />
          <rect x="76" y="26" width="38" height="22" className={styles.solid} />
          <rect x="76" y="54" width="38" height="20" className={styles.solidDim} />
          <path d="M28 44 l-8 6 l8 6 M48 44 l8 6 l-8 6" className={styles.code} />
          <rect x="72" y="22" width="4" height="4" className={styles.lime} />
        </>
      )}
      {step === 3 && (
        <>
          <rect x="6" y="6" width="108" height="14" className={styles.solid} />
          <rect x="6" y="26" width="64" height="48" className={styles.solidDim} />
          <rect x="76" y="26" width="38" height="22" className={styles.solid} />
          <rect x="76" y="54" width="38" height="20" className={styles.solidDim} />
          <circle cx="74" cy="24" r="13" className={styles.loupe} />
          <rect x="70" y="20" width="8" height="8" className={styles.lime} />
          <path d="M83 33 L94 44" className={styles.loupeHandle} />
        </>
      )}
    </svg>
  );
}

export default function Process() {
  const { t } = useLocale();
  const { stages } = t.process;
  const timeline = useRef(null);
  const [reached, setReached] = useState(0);
  useScrollProgress(timeline, {
    start: 0.85,
    end: 0.55,
    onProgress: (p) => {
      const n = Math.min(stages.length, Math.floor(p * stages.length + 0.35));
      setReached((prev) => (prev === n ? prev : n));
    },
  });

  return (
    <section className={`${styles.section} shell`} aria-labelledby="process-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="process-title" className={`${styles.title} display-sm`}>
          <Lines lines={t.process.title} />
        </h2>
        <p className={`${styles.side} rise`} style={{ '--i': 2 }}>
          {t.process.side}
        </p>
      </Reveal>

      <ol ref={timeline} className={styles.timeline} style={{ '--reached': reached }}>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} />
        </span>
        {stages.map((stage, i) => (
          <li key={i} className={styles.stage} data-reached={i < reached || undefined}>
            <span className={styles.node} aria-hidden="true" />
            <span className={`${styles.index} mono`}>{String(i + 1).padStart(2, '0')}</span>
            <StageVisual step={i} />
            <h3 className={styles.stageTitle}>{stage.title}</h3>
            <p className={styles.text}>{stage.text}</p>
            <ul className={`${styles.outputs} mono`} aria-label={t.process.outputsLabel(stage.title)}>
              {stage.outputs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
