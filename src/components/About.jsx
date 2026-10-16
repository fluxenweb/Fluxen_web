import Reveal from './Reveal';
import Lines from './Lines';
import PixelField from './PixelField';
import styles from './About.module.css';

const SPEC = [
  ['Approach', 'Design-led and goal-driven. Every decision traces back to what the business needs the site to do.'],
  ['Craft', 'Typography, spacing and motion tuned by hand at every breakpoint — not left to a template.'],
  ['Technology', 'Modern, lightweight stacks. Semantic, accessible markup. Performance budgets from day one.'],
  ['Working style', 'Independent and deliberately focused. You talk directly to the people designing and building your project.'],
  ['Ambition', 'Work that stands next to the best on the web — and keeps working long after launch.'],
];

export default function About() {
  return (
    <section className={`${styles.section} shell`} aria-labelledby="about-title">
      <Reveal className={styles.top}>
        <h2 id="about-title" className={`${styles.title} display`}>
          <Lines lines={['Small details.']} />
          <span className={styles.indent}>
            <Lines lines={['Big']} start={1} />
          </span>
          <Lines lines={['difference.']} start={2} />
        </h2>
        <div className={`${styles.field} rise`} style={{ '--i': 3 }}>
          <PixelField />
        </div>
      </Reveal>

      <Reveal className={styles.bottom}>
        <div className={styles.copy}>
          <p className={`${styles.lead} rise`}>
            FluxenWeb is a design-driven digital studio. We make websites and web products for companies that see
            their digital presence as part of the product, not an afterthought.
          </p>
          <p className={`${styles.body} rise`} style={{ '--i': 1 }}>
            We keep the studio small on purpose. Fewer projects, more attention: strategy, design and engineering
            stay in the same room, so nothing gets lost between a good idea and the code that ships it.
          </p>
        </div>
        <dl className={styles.spec}>
          {SPEC.map(([k, v], i) => (
            <div key={k} className={styles.specRow}>
              <span className="rule" style={{ '--i': i }} />
              <dt className={`${styles.specKey} mono rise`} style={{ '--i': i }}>
                {k}
              </dt>
              <dd className={`${styles.specVal} rise`} style={{ '--i': i }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
