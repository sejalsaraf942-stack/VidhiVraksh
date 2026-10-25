'use client';

import React, { useEffect, useRef } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Additive motion layer for the homepage. It does not change any section's markup:
 * it only tags existing elements with data attributes that globals.css animates,
 * and renders its own decorative layers (scroll progress bar, hero spotlight).
 *
 * Content is only hidden for a reveal after this script has started observing it,
 * so if JavaScript fails everything stays visible. Reduced-motion users get no motion.
 */
export default function HomeMotion() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Scroll progress bar (works with reduced motion too: it tracks scrolling, it doesn't animate on its own).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressRef.current?.style.setProperty('transform', `scaleX(${ratio})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Scroll reveals and the hero spotlight.
  useEffect(() => {
    const root = anchorRef.current?.parentElement;
    if (!root || window.matchMedia(REDUCED_MOTION_QUERY).matches || !('IntersectionObserver' in window)) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>(':scope > section'));
    const hero = sections[0];
    const tagged: HTMLElement[] = [];

    // Every section after the hero: its header block and each item in its grids rise into view.
    // Sections themselves are never transformed (Core Features renders a fixed modal inside its section).
    for (const section of sections.slice(1)) {
      const container = section.firstElementChild as HTMLElement | null;
      if (!container) continue;
      for (const block of Array.from(container.children) as HTMLElement[]) {
        const isGrid = getComputedStyle(block).display === 'grid';
        const items = isGrid ? (Array.from(block.children) as HTMLElement[]) : [block];
        for (const el of items) {
          el.setAttribute('data-reveal', '');
          if (isGrid && getComputedStyle(el).borderTopWidth !== '0px') el.setAttribute('data-reveal-card', '');
          tagged.push(el);
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', '');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    tagged.forEach((el) => observer.observe(el));
    root.setAttribute('data-motion', 'on');

    // Soft gold spotlight that follows the pointer across the hero (pointer devices only).
    const spotlight = spotlightRef.current;
    let removeSpotlight = () => {};
    if (hero && spotlight && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const place = () => {
        spotlight.style.top = `${hero.offsetTop}px`;
        spotlight.style.height = `${hero.offsetHeight}px`;
      };
      const onMove = (e: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        spotlight.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        spotlight.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
        spotlight.setAttribute('data-active', '');
      };
      const onLeave = () => spotlight.removeAttribute('data-active');
      const resizeObserver = new ResizeObserver(place);
      place();
      resizeObserver.observe(hero);
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
      removeSpotlight = () => {
        resizeObserver.disconnect();
        hero.removeEventListener('pointermove', onMove);
        hero.removeEventListener('pointerleave', onLeave);
      };
    }

    return () => {
      observer.disconnect();
      removeSpotlight();
      root.removeAttribute('data-motion');
      tagged.forEach((el) => {
        el.removeAttribute('data-reveal');
        el.removeAttribute('data-reveal-card');
        el.removeAttribute('data-revealed');
      });
    };
  }, []);

  return (
    <>
      <span ref={anchorRef} className="home-motion-anchor" hidden />
      <div className="home-scroll-progress" aria-hidden="true">
        <div ref={progressRef} className="home-scroll-progress-bar" />
      </div>
      <div ref={spotlightRef} className="home-hero-spotlight" aria-hidden="true" />
    </>
  );
}
