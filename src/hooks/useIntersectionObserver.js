import { useState, useEffect, useRef } from 'react';

/**
 * High-performance IntersectionObserver hook for viewport-triggered reveals.
 * Automatically unobserves elements once triggered to minimize CPU overhead.
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  const {
    threshold = 0.12,
    rootMargin = '0px 0px -40px 0px',
    triggerOnce = true
  } = options;

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsIntersecting(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (triggerOnce) {
          observer.unobserve(element);
        }
      } else if (!triggerOnce) {
        setIsIntersecting(false);
      }
    }, {
      threshold,
      rootMargin
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [targetRef, isIntersecting];
}

export default useIntersectionObserver;
