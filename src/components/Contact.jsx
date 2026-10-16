import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Loader2, RotateCcw } from 'lucide-react';
import { site } from '../config/site';
import Reveal from './Reveal';
import Lines from './Lines';
import styles from './Contact.module.css';

const PROJECT_TYPES = ['Website', 'Landing page', 'E-commerce', 'Web app / CRM', 'Interactive & motion', 'Something else'];
const BUDGETS = ['Under €5k', '€5k–15k', '€15k–40k', '€40k+', 'Not sure yet'];
const EMPTY = { name: '', email: '', company: '', type: '', budget: '', message: '' };
const MIN_MESSAGE = 20;
const MAX_MESSAGE = 1200;

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!values.email.trim()) errors.email = 'Enter your email address so we can reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = 'This email address looks incomplete. Check for a typo, e.g. name@company.com.';
  if (!values.type) errors.type = 'Choose the type of project.';
  const len = values.message.trim().length;
  if (len < MIN_MESSAGE) errors.message = `Tell us a little more — at least ${MIN_MESSAGE} characters (${len} so far).`;
  return errors;
}

function buildMailto(values) {
  const subject = `Project brief — ${values.type}${values.company ? ` for ${values.company}` : ''}`;
  const body = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.company && `Company: ${values.company}`,
    `Project type: ${values.type}`,
    values.budget && `Budget: ${values.budget}`,
    '',
    values.message,
  ]
    .filter((line) => line !== false && line !== '')
    .join('\n');
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Field({ id, label, optional, error, children, hint }) {
  return (
    <div className={styles.field} data-invalid={error ? true : undefined}>
      <label htmlFor={id} className={`${styles.label} mono`}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
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

function Choices({ name, legend, options, value, onChange, error, optional }) {
  return (
    <fieldset
      className={styles.fieldset}
      data-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className={`${styles.label} mono`}>
        {legend}
        {optional && <span className={styles.optional}> (optional)</span>}
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
            <span>{option}</span>
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
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | checking | ready
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);
  const resultRef = useRef(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

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
  const messageLen = values.message.length;

  return (
    <section id="contact" className={`${styles.section} shell`} aria-labelledby="contact-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="contact-title" className={styles.title}>
          <Lines lines={['Have a good']} />
          <span className={styles.indent}>
            <Lines lines={['problem?']} start={1} />
          </span>
        </h2>
      </Reveal>

      <div className={styles.layout}>
        <Reveal className={styles.aside}>
          <p className={`${styles.lede} rise`}>Let&rsquo;s turn your next idea into something worth experiencing.</p>
          <div className={`${styles.mailBlock} rise`} style={{ '--i': 1 }}>
            <span className={`${styles.label} mono`}>Write to us directly</span>
            <a href={`mailto:${site.email}`} className={styles.mail}>
              {site.email}
              <ArrowUpRight size={22} strokeWidth={1.4} aria-hidden="true" />
            </a>
            <button type="button" className={`${styles.copy} mono`} onClick={copyEmail}>
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy address'}
            </button>
            <span className="visually-hidden" aria-live="polite">
              {copied ? 'Email address copied to clipboard' : ''}
            </span>
          </div>
          <dl className={`${styles.facts} rise`} style={{ '--i': 2 }}>
            <div>
              <dt className="mono">Availability</dt>
              <dd>
                <span className={styles.dot} aria-hidden="true" />
                {site.availability}
              </dd>
            </div>
            <div>
              <dt className="mono">Works with</dt>
              <dd>Startups and companies worldwide, remotely</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal className={styles.formWrap} threshold={0.05}>
          {status !== 'ready' ? (
            <form ref={formRef} className={`${styles.form} rise`} noValidate onSubmit={onSubmit} aria-describedby="form-note">
              <div className={styles.row2}>
                <Field id="contact-name" label="Name" error={errors.name}>
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
                <Field id="contact-email" label="Email" error={errors.email}>
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
              <Field id="contact-company" label="Company" optional>
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
                legend="Project type"
                options={PROJECT_TYPES}
                value={values.type}
                onChange={set('type')}
                error={errors.type}
              />
              <Choices
                name="budget"
                legend="Budget range"
                options={BUDGETS}
                value={values.budget}
                onChange={set('budget')}
                optional
              />

              <Field
                id="contact-message"
                label="Project description"
                error={errors.message}
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
                  placeholder="What are you building, who is it for, and when would you like to launch?"
                  value={values.message}
                  onChange={(e) => set('message')(e.target.value)}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  required
                />
              </Field>

              <div className={styles.submitRow}>
                <p id="form-note" className={`${styles.note} mono`}>
                  <span className={styles.noteTag}>Demo form</span>
                  Nothing is sent from this page. Once your brief checks out, you can send it to us from your own
                  email app.
                </p>
                <button type="submit" className={styles.submit} disabled={status === 'checking'}>
                  {status === 'checking' ? (
                    <>
                      <Loader2 size={18} className={styles.spin} aria-hidden="true" />
                      Checking brief…
                    </>
                  ) : (
                    <>
                      Check my brief
                      <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              <p className="visually-hidden" aria-live="polite">
                {attempted && errorCount > 0
                  ? `${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention.`
                  : status === 'checking'
                    ? 'Checking your brief.'
                    : ''}
              </p>
            </form>
          ) : (
            <div ref={resultRef} className={styles.result} tabIndex={-1} aria-labelledby="result-title">
              <span className={`${styles.resultTag} mono`}>
                <Check size={14} aria-hidden="true" /> Brief complete — not sent yet
              </span>
              <h3 id="result-title" className={styles.resultTitle}>
                Thanks, {values.name.trim().split(' ')[0]}. Your brief is ready to send.
              </h3>
              <p className={styles.resultText}>
                This site has no backend, so nothing has been delivered. Open it in your email app to send it to{' '}
                <strong>{site.email}</strong> — everything you wrote is already filled in.
              </p>
              <dl className={styles.summary}>
                {[
                  ['Project', values.type],
                  ['Budget', values.budget || 'Not specified'],
                  ['Company', values.company || '—'],
                  ['Reply to', values.email],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.resultActions}>
                <a href={buildMailto(values)} className={styles.submit}>
                  Send brief by email
                  <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
                </a>
                <button type="button" className={styles.secondary} onClick={() => setStatus('idle')}>
                  Edit brief
                </button>
                <button type="button" className={styles.secondary} onClick={reset}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Start over
                </button>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
