import { useEffect } from 'react';

/** Prevents the page behind an overlay from scrolling, without layout jump. */
export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    documentElement.style.setProperty('--scrollbar-comp', `${scrollbar}px`);
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      documentElement.style.setProperty('--scrollbar-comp', '0px');
    };
  }, [locked]);
}
