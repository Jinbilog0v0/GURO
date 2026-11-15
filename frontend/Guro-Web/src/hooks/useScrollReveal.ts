import { useEffect } from 'react';

/**
 * Reusable hook that observes all `.scroll-reveal-card` elements within the container/viewport.
 * As the user scrolls down, intersecting cards smoothly animate upwards with staggered delays.
 */
export function useScrollReveal(dependencyKey?: any) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fallback if IntersectionObserver is unsupported in the current browser
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-reveal-card').forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Unobserve once revealed to keep performance lightweight
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal-card:not(.is-visible)');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [dependencyKey]);
}
