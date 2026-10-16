import { useEffect, useState } from 'react';
import { subscribe } from './scrollLoop';

export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => subscribe(() => setScrolled(window.scrollY > threshold)), [threshold]);
  return scrolled;
}
