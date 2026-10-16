import { ArrowUpRight, Send } from 'lucide-react';
import { BRIEF_EVENT, plans } from '../data/pricing';
import { site } from '../config/site';
import { useLocale } from '../i18n/LocaleContext';
import Reveal from './Reveal';
import Lines from './Lines';
import RollingNumber from './RollingNumber';
import styles from './Pricing.module.css';

/** Tell the contact form which project type the visitor picked. */
const requestBrief = (type) => window.dispatchEvent(new CustomEvent(BRIEF_EVENT, { detail: { type } }));

function PlanRow({ plan, index }) {
  const { t } = useLocale();
  const p = t.pricing;
  const copy = p.plans[plan.id];

  return (
    <Reveal as="li" className={styles.row} data-featured={plan.featured || undefined} threshold={0.25}>
      <span className="rule" style={{ '--i': index }} />
      <div className={styles.inner}>
        <span className={`${styles.num} mono`}>
          {plan.index}
          {plan.featured && <span className={styles.tag}>{p.popular}</span>}
        </span>
        <div className={styles.info}>
          <h3 className={styles.title}>{copy.title}</h3>
          <p className={styles.text}>{copy.text}</p>
        </div>
        <p className={styles.price}>
          <span className="visually-hidden">
            {p.from} {plan.price} {p.currency}
          </span>
          <span className={styles.priceVisual} aria-hidden="true">
            <span className={`${styles.from} mono`}>{p.from}</span>
            <RollingNumber value={plan.price} className={styles.amount} />
            <span className={`${styles.currency} mono`}>{p.currency}</span>
          </span>
        </p>
        <a
          href="#contact"
          className={styles.go}
          aria-label={p.discuss(copy.title)}
          onClick={() => requestBrief(plan.type)}
        >
          <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>
    </Reveal>
  );
}

export default function Pricing() {
  const { t } = useLocale();
  const p = t.pricing;

  return (
    <section id="pricing" className={`${styles.section} shell`} aria-labelledby="pricing-title">
      <Reveal as="header" className={styles.header}>
        <p className={`${styles.kicker} mono rise`}>{p.kicker}</p>
        <h2 id="pricing-title" className={`${styles.heading} display-sm`}>
          <Lines lines={p.title} />
        </h2>
        <p className={`${styles.lede} rise`} style={{ '--i': 2 }}>
          {p.lede}
        </p>
      </Reveal>

      <ul className={styles.list}>
        {plans.map((plan, i) => (
          <PlanRow key={plan.id} plan={plan} index={i} />
        ))}
      </ul>

      <Reveal className={styles.footer}>
        <p className={`${styles.note} mono rise`}>{p.note}</p>
        <div className={`${styles.actions} rise`} style={{ '--i': 1 }}>
          <a href="#contact" className={styles.cta}>
            {p.cta}
            <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
          <a href={site.telegram} className={styles.telegram} target="_blank" rel="noreferrer noopener">
            <Send size={16} strokeWidth={1.5} aria-hidden="true" />
            {p.telegram}
            <span className="visually-hidden">{t.footer.newTab}</span>
          </a>
        </div>
        <p className={`${styles.footnote} mono rise`} style={{ '--i': 2 }}>
          <span className={styles.dot} aria-hidden="true" />
          {p.footnote}
        </p>
      </Reveal>
    </section>
  );
}
