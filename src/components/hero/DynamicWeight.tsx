"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface DynamicWeightProps {
  /** The text to render, split per-letter. */
  text: string;
  /** Resting weight, far from the cursor (100–900). */
  from?: number;
  /** Peak weight, directly under the cursor (100–900). */
  to?: number;
  /** How far the proximity reach extends, in px. */
  strength?: number;
  /**
   * Per-frame easing factor (0–1) for ramp-in and ramp-out smoothing.
   * Higher snaps faster to the target weight; lower is more fluid.
   */
  transition?: number;
  /** Applied to the outer wrapper (e.g. a gradient clip). */
  className?: string;
}

/**
 * Morphs each letter between two font weights based on its distance from the
 * cursor, driving a live variable-font hover effect. Weights are mutated
 * directly on the DOM each frame (no React re-render) for smooth 60fps output.
 *
 * Requires a variable font with a `wght` axis on the wrapping element — here
 * that's Sora (`--font-display`, loaded variable in layout.tsx).
 */
export function DynamicWeight({
  text,
  from = 400,
  to = 800,
  strength = 130,
  transition = 0.16,
  className,
}: DynamicWeightProps) {
  const reduced = useReducedMotion();
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chars = Array.from(text);

  useEffect(() => {
    if (reduced) return;
    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (letters.length === 0) return;

    // Current weight per letter, smoothed toward its target each frame.
    const weights = letters.map(() => from);
    // Rest-position centers, cached so morphing weights never feed back into
    // the proximity math (which would cause jitter).
    let centers = letters.map(() => ({ x: 0, y: 0 }));
    const pointer = { x: 0, y: 0, active: false };

    const measure = () => {
      centers = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    const onMove = (x: number, y: number) => {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const onLeave = () => {
      pointer.active = false;
    };

    let raf = 0;
    const tick = () => {
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i];
        let target = from;
        if (pointer.active) {
          const d = Math.hypot(pointer.x - c.x, pointer.y - c.y);
          const proximity = Math.max(0, 1 - d / strength); // 1 at center → 0 at reach
          target = from + (to - from) * proximity;
        }
        const next = weights[i] + (target - weights[i]) * transition;
        weights[i] = next;
        letters[i].style.fontVariationSettings = `"wght" ${next.toFixed(1)}`;
      }
      raf = requestAnimationFrame(tick);
    };

    measure();
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    // Re-measure once the variable font swaps in and metrics settle.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [reduced, from, to, strength, transition, text]);

  // Reduced motion: render statically at the midpoint weight, no tracking.
  const restWeight = reduced ? Math.round((from + to) / 2) : from;

  return (
    <span className={className}>
      {/* Semantic text for screen readers; the morphing letters are decorative. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              fontVariationSettings: `"wght" ${restWeight}`,
              willChange: "font-variation-settings",
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
