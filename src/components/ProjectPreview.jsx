import styles from './ProjectPreview.module.css';

/*
 * Four hand-built compositions — one visual identity per concept project.
 * Pointer position arrives as CSS variables (--cx, --cy, --lx) set by the parent.
 */

function VantaLayer({ alt }) {
  return (
    <div className={`${styles.vantaLayer} ${alt ? styles.vantaAlt : ''}`}>
      <span className={styles.vantaWord}>VANTA</span>
      <span className={`${styles.arch} ${styles.archA}`} />
      <span className={`${styles.arch} ${styles.archB}`} />
      <span className={styles.vantaSeason}>{alt ? 'Noir / AW27' : 'Bone / SS27'}</span>
      <div className={styles.vantaTag}>
        <span className={styles.vantaTagName}>Coat 04 — {alt ? 'Camel' : 'Oxblood'}</span>
        <span className={styles.vantaSwatches}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.vantaTagPrice}>€ 480</span>
        <span className={styles.vantaTagBtn}>Add to bag</span>
      </div>
    </div>
  );
}

function Vanta() {
  return (
    <div className={styles.vanta}>
      <VantaLayer />
      <div className={styles.vantaReveal}>
        <VantaLayer alt />
      </div>
    </div>
  );
}

function Orbit() {
  return (
    <div className={styles.orbit}>
      <svg className={styles.orbitSvg} viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
        <g className={styles.rings}>
          {[90, 150, 215, 285].map((r, i) => (
            <g key={r} className={styles.ringGroup} style={{ '--d': `${28 + i * 14}s`, '--dir': i % 2 ? -1 : 1 }}>
              <ellipse cx="300" cy="300" rx={r} ry={r * 0.92} fill="none" stroke="currentColor" strokeOpacity={0.5 - i * 0.08} />
              <circle cx={300 + r} cy="300" r={i === 1 ? 9 : 5} fill="currentColor" />
            </g>
          ))}
        </g>
        <circle cx="300" cy="300" r="34" fill="currentColor" />
      </svg>
      <span className={styles.orbitWord}>ORBIT</span>
      <div className={styles.orbitPanel}>
        <span className={styles.orbitPanelHead}>Team sync · Thu</span>
        {[
          ['Berlin', '09:30', 0.2],
          ['Singapore', '15:30', 0.55],
          ['New York', '03:30', 0.82],
        ].map(([city, time, x]) => (
          <span className={styles.orbitRow} key={city}>
            <span>{city}</span>
            <span className={styles.orbitTrack}>
              <i style={{ left: `${x * 100}%` }} />
            </span>
            <span>{time}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Monolith() {
  return (
    <div className={styles.monolith}>
      <span className={styles.monoLabel}>MONOLITH</span>
      <span className={styles.monoPlan}>Section A–A · 1:200</span>
      <div className={styles.slabs}>
        {[
          { h: 64, w: 13, x: 18 },
          { h: 82, w: 18, x: 40 },
          { h: 46, w: 10, x: 68 },
        ].map((s, i) => (
          <span
            key={i}
            className={styles.slab}
            style={{ '--h': `${s.h}%`, '--w': `${s.w}%`, '--x': `${s.x}%`, '--depth': i + 1 }}
          >
            <span className={styles.shadow} />
          </span>
        ))}
        <span className={styles.ground} />
      </div>
      <span className={styles.dim}>
        <span>32.40 m</span>
      </span>
    </div>
  );
}

const barsA = [38, 52, 44, 61, 58, 72, 49, 66, 80, 74, 88, 92];
const barsB = [56, 40, 63, 47, 70, 55, 82, 60, 71, 90, 68, 84];

function Pulse() {
  return (
    <div className={styles.pulse}>
      <div className={styles.pulseHead}>
        <span className={styles.pulseLogo}>PULSE</span>
        <span className={styles.pulseRange}>Last 12 weeks</span>
      </div>
      <div className={styles.pulseKpi}>
        <span className={styles.pulseKpiLabel}>Revenue</span>
        <span className={styles.pulseKpiValue}>48.2k</span>
        <span className={styles.pulseKpiDelta}>+12.4%</span>
      </div>
      <div className={styles.pulseChart}>
        {barsA.map((h, i) => (
          <span key={i} className={styles.bar} style={{ '--a': `${h}%`, '--b': `${barsB[i]}%`, '--i': i }} />
        ))}
        <svg className={styles.pulseLine} viewBox="0 0 120 40" preserveAspectRatio="none">
          <path d="M0 30 L10 26 L20 28 L30 20 L40 22 L50 14 L60 18 L70 11 L80 13 L90 7 L100 9 L110 4 L120 6" pathLength="1" />
        </svg>
        <span className={styles.pulseNote}>Checkout drop · Tue</span>
      </div>
    </div>
  );
}

const map = { vanta: Vanta, orbit: Orbit, monolith: Monolith, pulse: Pulse };

export default function ProjectPreview({ id, className = '' }) {
  const Art = map[id];
  return (
    <div className={`${styles.preview} ${className}`.trim()} aria-hidden="true">
      <Art />
    </div>
  );
}
