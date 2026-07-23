"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { clsx } from "@/lib/clsx";

/**
 * Light/dark toggle. Shows the icon of the theme you'd switch *to* (a sun in
 * dark mode, a moon in light) and flips `theme` in the UI store, which
 * Providers persists + reflects onto <html data-theme>.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUIStore((s) => s.theme);
  const reduced = useUIStore((s) => s.reducedMotion);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      className={clsx(
        "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full glass-strong text-fg transition-transform hover:-translate-y-0.5 active:scale-95",
        className
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={reduced ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: reduced ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inline-flex"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
