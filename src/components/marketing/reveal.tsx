'use client';
import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

/**
 * Scroll reveal. One implementation, used by every marketing section.
 *
 * Two rules hold this together, and breaking either one causes a real bug:
 *
 *   1. ONLY transform + opacity animate. Both are composited on the GPU, so a
 *      mid-range Android doesn't repaint on every frame. Animating height,
 *      top, or margin here would shift layout and drop frames on exactly the
 *      phones most of Pakistan is browsing on.
 *
 *   2. prefers-reduced-motion changes DURATIONS, never GEOMETRY. The hidden
 *      state is `y: 14` for everyone, including reduced-motion users — we just
 *      collapse their duration to 0 so it snaps straight to visible.
 *
 *      This matters because framer resolves `initial` during SSR and writes it
 *      into the HTML. On the server the media query is unknowable, so it always
 *      renders the full-motion styles. If reduced-motion users got a different
 *      `y`, the client's first paint would disagree with the server's markup
 *      and React would log a hydration mismatch. Durations aren't styles, so
 *      varying them is free.
 *
 * That same SSR behaviour has a sharp edge: `opacity: 0` is written into the
 * served HTML, and it is JS that animates it back to 1. If the bundle never
 * runs, the copy is in the DOM but invisible — a blank marketing page on the
 * exact slow connections we care most about. Every reveal is therefore tagged
 * `data-reveal`, and the <noscript> block in the marketing layout forces those
 * elements visible. Cheap insurance on the page that has to load for everyone.
 */
const EASE = [0.2, 0.8, 0.2, 1] as const;
const DURATION = 0.32;              // MASTER: gentle reveal, 200–350ms
const OFFSET = 14;                  // px of travel. Small on purpose.

/** Start revealing slightly before the element is fully on screen. */
const VIEWPORT = { once: true, margin: '0px 0px -80px 0px' } as const;

/** A single element that fades + rises into view once. */
export function Reveal({ children, className, delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{
        duration: reduced ? 0 : DURATION,
        delay: reduced ? 0 : delay,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps a grid or list; its <RevealItem> children come in one after another.
 *
 * The stagger lives on the parent rather than as a hand-tuned `delay` on each
 * child so that adding a seventh card doesn't mean renumbering six delays.
 */
export function RevealGroup({ children, className, stagger = 0.06 }: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };

  return (
    <motion.div
      data-reveal
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

/** A child of <RevealGroup>. Inherits its turn in the stagger from the parent. */
export function RevealItem({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: OFFSET },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : DURATION, ease: EASE },
    },
  };

  return (
    <motion.div data-reveal className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
