"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScrollToOptions {
  offset?: number;
}

interface SmoothScrollApi {
  /** Programmatically scroll to a selector, element, or absolute Y position. */
  scrollTo: (target: string | number | HTMLElement, opts?: ScrollToOptions) => void;
  /** Pause scrolling (e.g. while the mobile menu is open). */
  stop: () => void;
  /** Resume scrolling. */
  start: () => void;
  /**
   * The live Lenis instance (or `null` when reduced-motion disables it).
   * Exposed so GSAP ScrollTrigger sections can sync their updates to Lenis'
   * frames — e.g. the Journey timeline calls `lenis.on("scroll", ...)`.
   */
  getLenis: () => Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
  getLenis: () => null,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Provides premium inertia scrolling via Lenis, plus a `scrollTo` used by the
 * navigation for smooth anchor jumps. Degrades to native (instant/auto)
 * behaviour when the user prefers reduced motion.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduced) {
      // Ensure any prior instance is gone and native scrolling is restored.
      document.documentElement.classList.remove("lenis");
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    document.documentElement.classList.add("lenis");

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove("lenis");
    };
  }, [reduced]);

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, opts?: ScrollToOptions) => {
      const offset = opts?.offset ?? 0;
      const lenis = lenisRef.current;

      if (lenis && !reduced) {
        lenis.scrollTo(target, { offset, duration: 1.2 });
        return;
      }

      // Reduced-motion / no-Lenis fallback.
      const el =
        typeof target === "string" ? document.querySelector(target) : target;
      if (typeof target === "number") {
        window.scrollTo({ top: target + offset, behavior: reduced ? "auto" : "smooth" });
      } else if (el instanceof HTMLElement) {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      }
    },
    [reduced]
  );

  const stop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.stop();
    else document.body.style.overflow = "hidden";
  }, []);

  const start = useCallback(() => {
    if (lenisRef.current) lenisRef.current.start();
    else document.body.style.overflow = "";
  }, []);

  const getLenis = useCallback(() => lenisRef.current, []);

  return (
    <SmoothScrollContext.Provider value={{ scrollTo, stop, start, getLenis }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
