"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * App-wide client providers. Syncs OS preferences into the UI store:
 *   • `prefers-reduced-motion` → AmbientBackground disables the grid drift.
 *   • colour theme → hydrated from the DOM (set by the boot script in
 *     layout.tsx) and kept in step with the OS until the user overrides it.
 *
 * (Smooth-scroll / GSAP wiring will be re-introduced when the animated
 * sections are built.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);
  const theme = useUIStore((s) => s.theme);
  const explicitTheme = useUIStore((s) => s.explicitTheme);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setReducedMotion]);

  // Hydrate the store from what the boot script already resolved onto <html>,
  // and register the OS listener. Runs once on mount.
  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();
    const domTheme =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    // `stored` present ⇒ the DOM value is an explicit, persisted choice.
    setTheme(domTheme, Boolean(stored));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      // Only track the OS while the visitor hasn't overridden it.
      if (!useUIStore.getState().explicitTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setTheme]);

  // Reflect theme changes back onto <html>, and persist explicit choices.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (explicitTheme) {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        /* storage unavailable — the in-memory theme still applies */
      }
    }
  }, [theme, explicitTheme]);

  return <>{children}</>;
}
