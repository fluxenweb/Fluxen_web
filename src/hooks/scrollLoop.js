/**
 * One shared rAF loop for every scroll-driven effect on the page.
 * Subscribers run at most once per frame, only when the page has scrolled
 * or resized, so dozens of effects cost a single listener.
 */
const subscribers = new Set();
let ticking = false;
let listening = false;

function run() {
  ticking = false;
  subscribers.forEach((fn) => fn());
}

function request() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(run);
  }
}

export function subscribe(fn) {
  subscribers.add(fn);
  if (!listening) {
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    listening = true;
  }
  request();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && listening) {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      listening = false;
    }
  };
}
