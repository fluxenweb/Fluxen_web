import { useId } from 'react';

/*
 * Vector redraw of the FLUXEN logo: a folded-metal "F" that sweeps from
 * electric indigo to white, and a wide geometric wordmark with a three-bar E.
 */

export function LogoMark({ className = '', title }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={className}
      viewBox="40 34 556 438"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0.05" y1="0.95" x2="0.95" y2="0.1">
          <stop offset="0" stopColor="#1c2050" />
          <stop offset="0.32" stopColor="#4f55fc" />
          <stop offset="0.62" stopColor="#dfe1ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="1" x2="1" y2="0.15">
          <stop offset="0" stopColor="#aeb7c8" />
          <stop offset="0.5" stopColor="#f1f2ff" />
          <stop offset="0.82" stopColor="#8e90ff" />
          <stop offset="1" stopColor="#4951fc" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id}-a)`}
        d="M250 38 H590 L515 130 Q507 140 492 140 H252 Q238 140 228 152 L45 355 V250 Q45 165 110 98 Q168 38 250 38 Z"
      />
      <path fill={`url(#${id}-s)`} opacity="0.5" d="M120 150 Q160 140 240 140 H252 Q238 140 228 152 L150 238 Q130 190 120 150 Z" />
      <path
        fill={`url(#${id}-b)`}
        d="M222 215 H465 L398 290 Q390 300 375 300 H290 Q262 300 245 320 L100 462 Q93 468 84 468 H45 V410 Z"
      />
    </svg>
  );
}

const LETTERS = [
  // F
  'M3 3 H56 M3 3 V37 M3 20 H48',
  // L
  'M3 3 V37 H56',
  // U
  'M3 3 V22 Q3 37 18 37 H41 Q56 37 56 22 V3',
  // X
  'M3 3 L56 37 M56 3 L3 37',
  // Ξ (three bars)
  'M3 3 H56 M3 20 H56 M8 37 H56 M8 37 Q3 37 3 32',
  // N
  'M3 37 V3 L56 37 V3',
];

export const LETTER_ADVANCE = 72;

export function LogoType({ className = '', letterClassName, strokeWidth = 5.4 }) {
  return (
    <svg
      className={className}
      viewBox={`-1 -1 ${LETTER_ADVANCE * 5 + 61} 42`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LETTERS.map((d, i) => (
        <g key={i} className={letterClassName} style={{ '--i': i }}>
          <path d={d} transform={`translate(${i * LETTER_ADVANCE} 0)`} />
        </g>
      ))}
    </svg>
  );
}
