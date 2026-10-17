import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Loader2, RotateCcw } from 'lucide-react';
import { site } from '../config/site';
import { BRIEF_EVENT } from '../data/pricing';
import Reveal from './Reveal';
import Lines from './Lines';
import { useLocale } from '../i18n/LocaleContext';
import styles from './Contact.module.css';

// Stored as stable ids so a language switch mid-form keeps the selection.
const PROJECT_TYPES = ['bot', 'website', 'landing', 'ecommerce', 'mobile', 'app', 'motion', 'other'];
const BUDGETS = ['s', 'm', 'l', 'xl', 'unsure'];
const EMPTY = { name: '', email: '', company: '', type: '', budget: '', message: '' };
const MIN_MESSAGE = 20;
const MAX_MESSAGE = 1200;

/** Returns error keys only; messages are looked up at render time so they follow the language. */
function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'name';
  if (!values.email.trim()) errors.email = 'emailEmpty';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = 'emailBad';
  if (!values.type) errors.type = 'type';
  if (values.message.trim().length < MIN_MESSAGE) errors.message = 'message';
  return errors;
}

function buildMailto(values, c) {
  const type = c.types[values.type];
  const subject = c.mail.subject(type, values.company);
  const body = [
    `${c.mail.name}: ${values.name}`,
    `${c.mail.email}: ${values.email}`,
    values.company && `${c.mail.company}: ${values.company}`,
    `${c.mail.type}: ${type}`,
    values.budget && `${c.mail.budget}: ${c.budgets[values.budget]}`,
    '',
    values.message,
  ]
    .filter((line) => line !== false && line !== '')
    .join('\n');
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Field({ id, label, optional, error, children, hint }) {
  const { t } = useLocale();
  return (
    <div className={styles.field} data-invalid={error ? true : undefined}>
      <label htmlFor={id} className={`${styles.label} mono`}>
        {label}
        {optional && <span className={styles.optional}>{t.contact.optional}</span>}
      </label>
      {children}
      <div className={styles.under}>
        {error ? (
          <p id={`${id}-error`} className={`${styles.error} mono`}>
            {error}
          </p>
        ) : (
          <span />
        )}
        {hint}
      </div>
    </div>
  );
}

function Choices({ name, legend, options, labels, value, onChange, error, optional }) {
  const { t } = useLocale();
  return (
    <fieldset
      className={styles.fieldset}
      data-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className={`${styles.label} mono`}>
        {legend}
        {optional && <span className={styles.optional}>{t.contact.optional}</span>}
      </legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option} className={styles.chip}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              onClick={() => optional && value === option && onChange('')}
            />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className={`${styles.error} mono`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default function Contact() {
  const { t } = useLocale();
  const c = t.contact;
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | checking | ready
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);
  const resultRef = useRef(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  // A price row was chosen: pre-select that project type.
  useEffect(() => {
    const onBrief = (event) => {
      const type = event.detail?.type;
      if (!PROJECT_TYPES.includes(type)) return;
      setValues((prev) => ({ ...prev, type }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.type;
        return next;
      });
      setStatus((prev) => (prev === 'ready' ? 'idle' : prev));
    };
    window.addEventListener(BRIEF_EVENT, onBrief);
    return () => window.removeEventListener(BRIEF_EVENT, onBrief);
  }, []);

  const set = (key) => (value) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (attempted) setErrors(validate(next));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const target = formRef.current.querySelector(first === 'type' ? 'input[name="type"]' : `#contact-${first}`);
      target?.focus();
      return;
    }
    // No backend: we only simulate a short check, then hand the brief to the visitor's email client.
    setStatus('checking');
    timer.current = setTimeout(() => {
      setStatus('ready');
      requestAnimationFrame(() => resultRef.current?.focus());
    }, 900);
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setAttempted(false);
    setStatus('idle');
    requestAnimationFrame(() => formRef.current?.querySelector('#contact-name')?.focus());
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const msg = (key) => {
    if (!errors[key]) return undefined;
    const text = c.errors[errors[key]];
    return typeof text === 'function' ? text(MIN_MESSAGE, values.message.trim().length) : text;
  };
  const messageLen = values.message.length;

  return (
    <section id="contact" className={`${styles.section} shell`} aria-labelledby="contact-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="contact-title" className={styles.title}>
          <Lines lines={[c.title[0]]} />
          <span className={styles.indent}>
            <Lines lines={[c.title[1]]} start={1} />
          </span>
        </h2>
      </Reveal>

      <div className={styles.layout}>
        <Reveal className={styles.aside}>
          <p className={`${styles.lede} rise`}>{c.lede}</p>
          <div className={`${styles.mailBlock} rise`} style={{ '--i': 1 }}>
            <span className={`${styles.label} mono`}>{c.direct}</span>
            <a href={`mailto:${site.email}`} className={styles.mail}>
              {site.email}
              <ArrowUpRight size={22} strokeWidth={1.4} aria-hidden="true" />
            </a>
            <button type="button" className={`${styles.copy} mono`} onClick={copyEmail}>
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? c.copied : c.copy}
            </button>
            <span className="visually-hidden" aria-live="polite">
              {copied ? c.copiedSr : ''}
            </span>
          </div>
          <dl className={`${styles.facts} rise`} style={{ '--i': 2 }}>
            <div>
              <dt className="mono">{c.statusKey}</dt>
              <dd>
                <span className={styles.dot} aria-hidden="true" />
                {t.availability}
              </dd>
            </div>
            <div>
              <dt className="mono">{c.worksWith}</dt>
              <dd>{c.worksWithValue}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal className={styles.formWrap} threshold={0.05}>
          {status !== 'ready' ? (
            <form ref={formRef} className={`${styles.form} rise`} noValidate onSubmit={onSubmit} aria-describedby="form-note">
              <div className={styles.row2}>
                <Field id="contact-name" label={c.labels.name} error={msg('name')}>
                  <input
                    id="contact-name"
                    className={styles.input}
                    type="text"
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => set('name')(e.target.value)}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    required
                  />
                </Field>
                <Field id="contact-email" label={c.labels.email} error={msg('email')}>
                  <input
                    id="contact-email"
                    className={styles.input}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => set('email')(e.target.value)}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    required
                  />
                </Field>
              </div>
              <Field id="contact-company" label={c.labels.company} optional>
                <input
                  id="contact-company"
                  className={styles.input}
                  type="text"
                  autoComplete="organization"
                  value={values.company}
                  onChange={(e) => set('company')(e.target.value)}
                />
              </Field>

              <Choices
                name="type"
                legend={c.labels.type}
                options={PROJECT_TYPES}
                labels={c.types}
                value={values.type}
                onChange={set('type')}
                error={msg('type')}
              />
              <Choices
                name="budget"
                legend={c.labels.budget}
                options={BUDGETS}
                labels={c.budgets}
                value={values.budget}
                onChange={set('budget')}
                optional
              />

              <Field
                id="contact-message"
                label={c.labels.message}
                error={msg('message')}
                hint={
                  <span className={`${styles.count} mono`} aria-hidden="true">
                    {messageLen}/{MAX_MESSAGE}
                  </span>
                }
              >
                <textarea
                  id="contact-message"
                  className={`${styles.input} ${styles.textarea}`}
                  rows={5}
                  maxLength={MAX_MESSAGE}
                  placeholder={c.placeholder}
                  value={values.message}
                  onChange={(e) => set('message')(e.target.value)}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  required
                />
              </Field>

              <div className={styles.submitRow}>
                <p id="form-note" className={`${styles.note} mono`}>
                  <span className={styles.noteTag}>{c.demoTag}</span>
                  {c.demoNote}
                </p>
                <button type="submit" className={styles.submit} disabled={status === 'checking'}>
                  {status === 'checking' ? (
                    <>
                      <Loader2 size={18} className={styles.spin} aria-hidden="true" />
                      {c.checking}
                    </>
                  ) : (
                    <>
                      {c.submit}
                      <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              <p className="visually-hidden" aria-live="polite">
                {attempted && errorCount > 0 ? c.srErrors(errorCount) : status === 'checking' ? c.srChecking : ''}
              </p>
            </form>
          ) : (
            <div ref={resultRef} className={styles.result} tabIndex={-1} aria-labelledby="result-title">
              <span className={`${styles.resultTag} mono`}>
                <Check size={14} aria-hidden="true" /> {c.result.tag}
              </span>
              <h3 id="result-title" className={styles.resultTitle}>
                {c.result.title(values.name.trim().split(' ')[0])}
              </h3>
              <p className={styles.resultText}>
                {c.result.textBefore}
                <strong>{site.email}</strong>
                {c.result.textAfter}
              </p>
              <dl className={styles.summary}>
                {[
                  [c.result.project, c.types[values.type]],
                  [c.result.budget, values.budget ? c.budgets[values.budget] : c.result.notSpecified],
                  [c.result.company, values.company || '—'],
                  [c.result.replyTo, values.email],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.resultActions}>
                <a href={buildMailto(values, c)} className={styles.submit}>
                  {c.result.send}
                  <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
                </a>
                <button type="button" className={styles.secondary} onClick={() => setStatus('idle')}>
                  {c.result.edit}
                </button>
                <button type="button" className={styles.secondary} onClick={reset}>
                  <RotateCcw size={14} aria-hidden="true" />
                  {c.result.restart}
                </button>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
