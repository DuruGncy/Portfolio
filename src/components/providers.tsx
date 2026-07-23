"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * App-wide client providers. For now this only syncs the OS
 * `prefers-reduced-motion` setting into the UI store, which the global
 * AmbientBackground reads to disable parallax/cursor lighting.
 *
 * (Smooth-scroll / GSAP wiring will be re-introduced when the animated
 * sections are built.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setReducedMotion]);

  return <>{children}</>;
}
