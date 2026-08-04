"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The page's only scroll affordance — the native document scrollbar is hidden
 * in `globals.css`. A hairline rail on the right edge fills downward as the
 * visitor moves through the page.
 *
 * It stays away during the hero: the opening screen earns its emptiness, and a
 * progress cue means nothing when there is no progress yet. It slides in once
 * the hero has left the top of the viewport, and retreats if you scroll back.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * True once the hero has scrolled off the top of the viewport. Watching the
 * element rather than a pixel threshold keeps the rule honest at any hero
 * height, zoom level or breakpoint.
 *
 * `boundingClientRect` disambiguates the two ways a section can be off screen:
 * only "above the viewport" counts, so this can never fire while still on the
 * hero itself.
 */
function usePastHero(): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("home");

    if (!hero) {
      // Defensive fallback — the hero is always rendered on the home route.
      const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.9);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) =>
        setPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return past;
}

export function ProgressRail() {
  const reduced = useReducedMotion();
  const past = usePastHero();

  // Document-level progress. Deliberately not `useScroll({ target })` — those
  // measurements are unstable under Lenis (see the note in `Hero.tsx`).
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  const fill = reduced ? scrollYProgress : smoothed;

  // Reveal by clipping rather than `scaleY`: the aurora is a gradient, and a
  // scaled element squashes it, so the fill's leading edge would sit on violet
  // at every progress. Clipping keeps the ramp fixed to the rail, so the edge
  // travels teal → cyan → violet as you move down the page.
  const clip = useTransform(fill, (v) => `inset(0 0 ${(1 - v) * 100}% 0)`);

  return (
    <motion.div
      aria-hidden
      initial={false}
      // `y` rides in `style` rather than a `-translate-y-1/2` class so framer
      // owns the whole transform and the two offsets compose instead of fight.
      style={{ y: "-50%" }}
      animate={{ opacity: past ? 1 : 0, x: past ? 0 : 8 }}
      transition={
        reduced ? { duration: 0.15 } : { duration: 0.5, ease: EASE }
      }
      className="pointer-events-none fixed right-3 top-1/2 z-40 h-[36vh] max-h-80 w-[3px] overflow-hidden rounded-full bg-(--border-strong) sm:right-4 md:right-5"
    >
      {/* Must be `background-image`. The `bg-*` utilities resolve a bare custom
          property to `background-color`, and a gradient is not a valid colour,
          so the declaration is silently dropped and nothing paints. */}
      <motion.div
        style={{ clipPath: clip }}
        className="h-full w-full rounded-full [background-image:var(--aurora)]"
      />
    </motion.div>
  );
}
