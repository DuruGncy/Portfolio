"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  MessageSquareText,
  Mic,
  MicOff,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { useUIStore } from "@/store/ui-store";
import { NAV_SCROLL_OFFSET } from "@/lib/sections";
import { clsx } from "@/lib/clsx";
import { phaseHint, phaseLabel, useAssistant } from "./ElevenLabsConversation";
import {
  AssistantOrb,
  Composer,
  LevelMeter,
  MicrophonePicker,
  ModeToggle,
  StatusLamps,
  Transcript,
} from "./AssistantVisuals";

/**
 * A remote control for the session that lives in `AISection` — same provider,
 * same conversation, so starting downstairs and continuing up here never opens
 * a second connection.
 *
 * Visibility is deliberate: the hero stays untouched, so the widget only exists
 * once the hero has scrolled out of view, and it retreats again if the visitor
 * scrolls back up.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * True once the hero has left the viewport. Watching the element rather than a
 * scroll threshold keeps the rule honest at any hero height or zoom level.
 */
function usePastHero(): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("home");

    if (!hero) {
      // Defensive fallback — the hero is always rendered today.
      const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return past;
}

export function FloatingAssistant() {
  const reduced = useReducedMotion();
  const pastHero = usePastHero();
  const { scrollTo } = useSmoothScroll();

  const open = useUIStore((s) => s.assistantOpen);
  const openAssistant = useUIStore((s) => s.openAssistant);
  const closeAssistant = useUIStore((s) => s.closeAssistant);
  const dismissed = useUIStore((s) => s.assistantDismissed);
  const dismissAssistant = useUIStore((s) => s.dismissAssistant);

  const { mode, phase, active, isMuted, error, start, stop, toggleMute } =
    useAssistant();
  const connecting = phase === "connecting" || phase === "permission";
  const isVoice = mode === "voice";

  const visible = pastHero && !dismissed;

  // Esc closes the expanded panel, matching the mobile menu and project modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAssistant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAssistant]);

  function goToSection() {
    closeAssistant();
    scrollTo("#ai-assistant", { offset: NAV_SCROLL_OFFSET });
  }

  /** Hides the widget entirely; a reload brings it back. */
  function dismiss() {
    closeAssistant();
    dismissAssistant();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
        >
          {/* ---------- expanded widget ---------- */}
          <AnimatePresence>
            {open && (
              <motion.div
                key="panel"
                role="dialog"
                aria-label="AI assistant"
                initial={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: 14, scale: 0.9, filter: "blur(6px)" }
                }
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                }
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, scale: 0.94, filter: "blur(4px)" }
                }
                transition={{ duration: 0.42, ease: EASE }}
                style={{ transformOrigin: "bottom right" }}
                className="relative w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] glass-strong p-5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.95)]"
              >
                <span
                  aria-hidden
                  className="ai-panel-grid pointer-events-none absolute inset-0"
                />

                {/* header */}
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm font-semibold tracking-tight">
                      Duru&apos;s AI assistant
                    </p>
                    <p
                      aria-live="polite"
                      className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-subtle"
                    >
                      {phaseLabel(phase, mode)}
                    </p>
                  </div>
                  <button
                    onClick={closeAssistant}
                    aria-label="Minimize the assistant"
                    className="-m-1 rounded-full p-1.5 text-subtle transition-colors hover:text-fg"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* voice or text */}
                <div className="relative mt-4 flex justify-center">
                  <ModeToggle />
                </div>

                {/* instrument */}
                <AnimatePresence mode="wait" initial={false}>
                  {isVoice ? (
                    <motion.div
                      key="voice"
                      initial={reduced ? undefined : { opacity: 0, y: 8 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: EASE }}
                      className="relative mt-4 flex flex-col items-center"
                    >
                      <AssistantOrb size={104} />
                      <LevelMeter className="mt-3 w-full" />
                      <MicrophonePicker className="mt-3" compact />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="text"
                      initial={reduced ? undefined : { opacity: 0, y: 8 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: EASE }}
                      className="relative mt-4"
                    >
                      <Transcript
                        className="h-44 rounded-xl border border-border-subtle bg-bg-2/40 p-3"
                        emptyHint="Type a question to get started."
                      />
                      <Composer className="mt-3" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The compact widget has no room for a banner, so the hint
                    line doubles as the error surface. */}
                <p
                  className={clsx(
                    "relative mt-3 min-h-8 px-2 text-center text-xs leading-relaxed text-pretty",
                    error ? "text-[#f87171]" : "text-muted"
                  )}
                >
                  {error ?? phaseHint(phase, isMuted, mode)}
                </p>

                <div className="relative mt-2 border-t border-border-subtle pt-4">
                  <StatusLamps className="justify-center gap-x-3" />
                </div>

                {/* controls */}
                <div className="relative mt-4 flex items-center gap-2">
                  <button
                    onClick={active ? stop : start}
                    disabled={connecting}
                    className={clsx(
                      "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-[transform,opacity,background-color] duration-300 hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0",
                      active
                        ? "border border-border-strong bg-surface-2 text-fg"
                        : "bg-fg text-bg"
                    )}
                  >
                    {active ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        Stop
                      </>
                    ) : (
                      <>
                        {isVoice ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MessageSquareText className="h-4 w-4" />
                        )}
                        {connecting
                          ? "Connecting…"
                          : isVoice
                            ? "Talk to me"
                            : "Start chat"}
                      </>
                    )}
                  </button>

                  {active && isVoice && (
                    <button
                      onClick={toggleMute}
                      aria-pressed={isMuted}
                      aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border-subtle text-muted transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:text-fg active:scale-95"
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4 text-violet" />
                      ) : (
                        <Mic className="h-4 w-4 text-teal" />
                      )}
                    </button>
                  )}
                </div>

                {/* footer — a way back to the full console, and a way out */}
                <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
                  <button
                    onClick={goToSection}
                    className="group inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle transition-colors hover:text-fg"
                  >
                    Full console
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <button
                    onClick={dismiss}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle transition-colors hover:text-fg"
                  >
                    <X className="h-3 w-3" />
                    Hide
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- collapsed button ---------- */}
          <div className="group relative flex items-center">
            {/* tooltip — pointer devices only; touch users get the label via aria */}
            <span
              aria-hidden
              className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full glass-strong px-3.5 py-2 text-xs text-muted opacity-0 shadow-lg transition-[opacity,transform] duration-300 [transform:translateX(6px)] group-hover:opacity-100 group-hover:[transform:translateX(0)] group-focus-within:opacity-100 group-focus-within:[transform:translateX(0)] sm:block"
            >
              {open ? "Minimize the assistant" : "Chat with my AI assistant"}
            </span>

            <button
              onClick={open ? closeAssistant : openAssistant}
              aria-expanded={open}
              aria-label={
                open ? "Minimize the assistant" : "Chat with my AI assistant"
              }
              className={clsx(
                "relative grid h-14 w-14 place-items-center rounded-full transition-transform duration-300 hover:-translate-y-0.5 active:scale-95",
                // The pulse only runs when the widget is idle and inviting.
                !open && !active && !reduced && "ai-pulse"
              )}
            >
              {/* aurora rim + glass fill */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full aurora-border shadow-[0_18px_40px_-18px_rgba(34,211,238,0.7)]"
              />
              <span className="relative">
                {open ? (
                  <ChevronDown className="h-5 w-5 text-fg" />
                ) : (
                  <Sparkles className="h-5 w-5 text-teal" />
                )}
              </span>

              {/* live badge — visible even while the panel is minimized */}
              {active && !open && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span
                    className={clsx(
                      "absolute inline-flex h-full w-full rounded-full opacity-70",
                      phase === "speaking" ? "bg-violet" : "bg-teal",
                      !reduced && "animate-ping"
                    )}
                  />
                  <span
                    className={clsx(
                      "relative inline-flex h-3 w-3 rounded-full border-2 border-bg",
                      phase === "speaking" ? "bg-violet" : "bg-teal"
                    )}
                  />
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
