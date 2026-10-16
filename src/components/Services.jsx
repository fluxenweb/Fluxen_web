import { useState } from 'react';
import { Plus } from 'lucide-react';
import { services } from '../data/services';
import ServiceGlyph from './ServiceGlyph';
import Reveal from './Reveal';
import Lines from './Lines';
import styles from './Services.module.css';

function ServiceRow({ service, open, onToggle, index }) {
  const [hover, setHover] = useState(false);
  const panelId = `service-${service.id}`;
  const active = open || hover;

  return (
    <Reveal
      as="li"
      className={styles.row}
      data-open={open || undefined}
      data-active={active || undefined}
      threshold={0.2}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span className="rule" style={{ '--i': index }} />
      <h3 className={styles.heading}>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={`${styles.num} mono`}>{service.index}</span>
          <span className={styles.title}>{service.title}</span>
          <span className={styles.short}>{service.short}</span>
          <span className={styles.glyph}>
            <ServiceGlyph name={service.glyph} />
          </span>
          <span className={styles.toggle} aria-hidden="true">
            <Plus size={20} strokeWidth={1.4} />
          </span>
        </button>
      </h3>
      <div id={panelId} className={styles.panel} role="region" aria-label={service.title}>
        <div className={styles.panelInner}>
          <div className={styles.panelGrid}>
            <p className={styles.detail}>{service.detail}</p>
            <ul className={styles.deliverables}>
              {service.deliverables.map((d) => (
                <li key={d}>
                  <span className={styles.tick} aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Services() {
  const [openId, setOpenId] = useState(services[0].id);

  return (
    <section id="services" className={`${styles.section} shell`} aria-labelledby="services-title">
      <Reveal as="header" className={styles.header}>
        <p className={`${styles.kicker} mono rise`}>Services / 06 disciplines</p>
        <h2 id="services-title" className={`${styles.heading2} display`}>
          <Lines lines={['Built with', 'intent.']} />
        </h2>
        <p className={`${styles.lede} rise`} style={{ '--i': 2 }}>
          One studio from first workshop to final deploy. Pick a single discipline or the whole stack — every
          engagement is shaped around what the project actually needs.
        </p>
      </Reveal>

      <ul className={styles.list}>
        {services.map((service, i) => (
          <ServiceRow
            key={service.id}
            index={i}
            service={service}
            open={openId === service.id}
            onToggle={() => setOpenId((cur) => (cur === service.id ? null : service.id))}
          />
        ))}
      </ul>
    </section>
  );
}
