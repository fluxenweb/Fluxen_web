import { useRef } from 'react';
import { useInView } from '../hooks/useInView';

/** Adds `.is-in` to its element once scrolled into view; children opt into effects via CSS classes. */
export default function Reveal({ as: Tag = 'div', className = '', threshold, rootMargin, children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref, { threshold, rootMargin });
  return (
    <Tag ref={ref} className={`${className} ${inView ? 'is-in' : ''}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
