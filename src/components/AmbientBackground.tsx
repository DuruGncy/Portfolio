"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUIStore } from "@/store/ui-store";
import { clsx } from "@/lib/clsx";

/**
 * Global ambient background — deliberately quiet.
 *
 *   1. base tint      — soft radial wash for depth
 *   2. blueprint grid — a single, very faint grid that drifts slowly
 *
 * That's it: no nodes, no links, no cursor tracking. The grid's slow drift is
 * paused under `prefers-reduced-motion` (or the in-UI toggle).
 */
export function AmbientBackground() {
  const reduced = useReducedMotion();
  const booted = useUIStore((s) => s.booted);

  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-base" />
      {/* Grid holds hidden behind the boot screen, then fades up as step 3 of
          the hero's wake-up. `--pre` is neutralised for no-JS users below. */}
      <div
        className={clsx(
          "ambient-grid",
          !reduced && "ambient-grid--drift",
          !booted && "ambient-grid--pre"
        )}
      />
    </div>
  );
}
