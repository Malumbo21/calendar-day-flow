'use client';

import { useEffect } from 'react';

export function LandingRevealEffects() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]')
    );

    if (nodes.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const showAll = () => {
      nodes.forEach(node => {
        node.dataset.revealed = 'true';
      });
    };

    if (reduceMotion.matches) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
            return;
          }

          entry.target.dataset.revealed = 'true';
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12,
      }
    );

    nodes.forEach(node => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return null;
}
