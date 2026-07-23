"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type Variants,
} from "framer-motion";
import { Check, CornerDownLeft, Loader2 } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { useUIStore } from "@/store/ui-store";

const STEPS = [
  "Booting DuruOS...",
  "Loading cloud modules...",
  "Connecting GitHub...",
  "Loading projects...",
  "Loading bookshelf...",
];

const BOOT_MS = 1800;

const list: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.2, staggerChildren: 0.26 } },
};
const line: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * DuruOS boot sequence — the site's opening beat.
 *
 * Design intent: Apple product-launch calm × developer tooling. A solid dark
 * stage, a monospace boot log that ticks through in ~2s, an aurora progress
 * bar, then "Ready." + "Press Enter". Dismisses (Enter / click / Esc / Skip)
 * with a soft blur-fade that reveals the homepage underneath.
 *
 * Fully self-contained; renders on top of everything and never touches other
 * sections. Disabled progressively via <noscript> and collapsed to an instant,
 * still-dismissible state under `prefers-reduced-motion`.
 */
export function BootScreen() {
  const reduced = useReducedMotion();
  const { stop, start } = useSmoothScroll();
  const setBooted = useUIStore((s) => s.setBooted);

  const [show, setShow] = useState(true);
  const [gone, setGone] = useState(false);
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);

  const dismissed = useRef(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const pct = useMotionValue(0);
  // Remaining fraction, mapped to a GPU transform so the mask reveal runs on
  // the compositor (not a per-frame `width` layout) and needs no re-render.
  const barScale = useTransform(pct, (v) => (100 - v) / 100);

  const proceed = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setShow(false);
    // Wake the page up: the hero/nav choreography starts now, overlapping the
    // overlay's blur-fade so the two motions hand off smoothly.
    setBooted();
  }, [setBooted]);

  // Lock scrolling while the boot screen is up.
  useEffect(() => {
    stop();
    document.body.style.overflow = "hidden";
    return () => {
      start();
      document.body.style.overflow = "";
    };
  }, [stop, start]);

  // Drive the progress bar + flip to "ready".
  useEffect(() => {
    if (reduced) {
      pct.set(100);
      setPercent(100);
      setReady(true);
      return;
    }
    const controls = animate(pct, 100, {
      duration: BOOT_MS / 1000,
      ease: [0.4, 0, 0.2, 1],
    });
    const t = setTimeout(() => setReady(true), BOOT_MS + 80);
    return () => {
      controls.stop();
      clearTimeout(t);
    };
  }, [reduced, pct]);

  useMotionValueEvent(pct, "change", (v) => setPercent(Math.round(v)));

  // Enter / Space / Escape all continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        proceed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proceed]);

  // Focus management: skip control first, then the Enter button once ready.
  useEffect(() => {
    skipRef.current?.focus();
  }, []);
  useEffect(() => {
    if (ready) enterRef.current?.focus();
  }, [ready]);

  if (gone) return null;

  return (
    <AnimatePresence onExitComplete={() => setGone(true)}>
      {show && (
        <motion.div
          className="boot-screen fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-bg"
          role="dialog"
          aria-modal="true"
          aria-label="DuruOS boot sequence"
          exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={proceed}
        >
          {/* aurora stage glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 38%, rgba(34,211,238,0.10), transparent 70%), radial-gradient(50% 40% at 70% 80%, rgba(167,139,250,0.08), transparent 70%)",
            }}
          />

          {/* Skip (always available) */}
          <button
            ref={skipRef}
            onClick={(e) => {
              e.stopPropagation();
              proceed();
            }}
            className="absolute right-5 top-5 font-mono text-xs text-subtle transition-colors hover:text-fg"
          >
            Skip →
          </button>

          <div
            className="relative w-[min(90vw,30rem)] px-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wordmark */}
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl aurora-border font-display text-sm font-bold">
                <span className="aurora-text">DG</span>
              </span>
              <div>
                <p className="font-display text-lg font-semibold leading-none tracking-tight text-fg">
                  DuruOS
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">
                  v1.0 · portfolio
                </p>
              </div>
              <span className="ml-auto">
                {ready ? (
                  <Check className="h-4 w-4 text-teal" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                )}
              </span>
            </div>

            {/* Boot log */}
            <motion.ul
              className="mt-8 space-y-2.5 font-mono text-sm"
              variants={reduced ? undefined : list}
              initial={reduced ? undefined : "hidden"}
              animate={reduced ? undefined : "show"}
            >
              {STEPS.map((s) => (
                <motion.li
                  key={s}
                  variants={reduced ? undefined : line}
                  className="flex items-center gap-3 text-muted"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-teal/80" />
                  <span>{s}</span>
                </motion.li>
              ))}
            </motion.ul>

            {/* Progress */}
            <div className="mt-8">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className={ready ? "text-teal" : "text-subtle"}>
                  {ready ? "Ready." : "Booting…"}
                </span>
                <span className="text-subtle tabular-nums">{percent}%</span>
              </div>
              <div
                className="relative mt-2 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "var(--aurora)" }}
              >
                {/* Mask shrinks as we load, revealing the fixed gradient
                    left-to-right so the leading edge travels teal→cyan→violet.
                    Scaled from the right on the compositor (origin-right +
                    scaleX) rather than animating `width`.
                    (Gradient is set inline: `bg-[var(--aurora)]` maps to an
                    invalid `background-color` and would render nothing.) */}
                <motion.div
                  className="absolute inset-0 origin-right bg-surface-2"
                  style={{ scaleX: barScale }}
                />
              </div>
            </div>

            {/* Press Enter */}
            <AnimatePresence>
              {ready && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.35 }}
                  className="mt-8 flex items-center justify-center"
                >
                  <button
                    ref={enterRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      proceed();
                    }}
                    className="group inline-flex items-center gap-2.5 rounded-full aurora-border px-5 py-2.5 text-sm text-fg transition-transform hover:-translate-y-0.5"
                  >
                    <span>Press</span>
                    <kbd className="rounded-md border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
                      Enter
                    </kbd>
                    <CornerDownLeft className="h-4 w-4 text-teal" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Screen-reader announcement */}
            <p className="sr-only" aria-live="polite">
              {ready ? "Ready. Press Enter to continue." : "Booting DuruOS."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
