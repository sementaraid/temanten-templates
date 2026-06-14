import { useRef } from 'react';
import { useInView } from 'motion/react';

export type ScrollRevealOptions = {
  once?: boolean;
  amount?: number | 'some' | 'all';
};

// Returns a [ref, isVisible] pair. Attach `ref` to the root element of a
// section; `isVisible` drives the section's animation variant.
//
// Usage:
//   const [ref, isVisible] = useScrollReveal();
//   <motion.div ref={ref} variants={…} animate={isVisible ? 'enter' : 'hidden'}>
export function useScrollReveal<T extends Element = HTMLDivElement>(
  options: ScrollRevealOptions = {},
): [React.RefObject<T>, boolean] {
  const { once = true, amount = 0.15 } = options;
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { once, amount });
  return [ref, isInView];
}
