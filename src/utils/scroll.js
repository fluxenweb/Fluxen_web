import { prefersReducedMotion } from '../hooks/useReducedMotion';

/** Scrolls to a section by id and moves keyboard focus there without a second jump. */
export function scrollToId(id) {
  const el = id === 'top' ? document.body : document.getElementById(id);
  if (!el) return;
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (id === 'top') window.scrollTo({ top: 0, behavior });
  else el.scrollIntoView({ behavior, block: 'start' });
  if (history.replaceState) history.replaceState(null, '', id === 'top' ? '#' : `#${id}`);
  if (id !== 'top') {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}
