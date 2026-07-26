"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  Mic,
  MicOff,
  MessageSquareText,
  Square,
  TriangleAlert,
  X,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SectionIndex } from "@/components/ui/SectionIndex";
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
 * The assistant's home on the page — a console, not a chat window. It sits
 * directly under the hero and is always present; the floating widget is only a
 * remote control for the very same session.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/** Openers that give a visitor who doesn't know what to ask somewhere to start. */
const PROMPTS = [
  "What's your cloud stack?",
  "Tell me about the Arkas internship.",
  "Why serverless over containers?",
  "When can you start, and where?",
];

export function AISection() {
  const reduced = useReducedMotion();
  const {
    mode,
    phase,
    active,
    isMuted,
    error,
    start,
    stop,
    toggleMute,
    ask,
    dismissError,
  } = useAssistant();

  const connecting = phase === "connecting" || phase === "permission";
  const isVoice = mode === "voice";

  const stageMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: EASE },
      };

  return (
    <section
      id="ai-assistant"
      data-section="ai-assistant"
      aria-labelledby="ai-assistant-title"
      className="section-pad relative mx-auto max-w-[100rem] scroll-mt-24 overflow-hidden py-20 md:py-28"
    >
      <SectionIndex>02</SectionIndex>

      {/* masthead */}
      <motion.div
        variants={reduced ? undefined : reveal}
        initial={reduced ? undefined : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true, amount: 0.6 }}
        className="relative mb-10 flex items-center gap-4"
      >
        <h2
          id="ai-assistant-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">02 — </span>AI Assistant
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          Voice · Text · Realtime
        </p>
      </motion.div>

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* ---------- the pitch ---------- */}
        <motion.div
          variants={reduced ? undefined : stagger}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h3
            variants={reduced ? undefined : reveal}
            className="font-display text-3xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            Don&apos;t read the CV.{" "}
            <span className="aurora-text">Interview it.</span>
          </motion.h3>

          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-5 max-w-lg text-base leading-[1.7] text-muted text-pretty"
          >
            I gave an agent everything on this page — the projects, the stack,
            the Erasmus semester in Brugge, what I&apos;m looking for next. Ask
            it anything you&apos;d ask me in a first call. Talk out loud, or
            type if you&apos;d rather keep it quiet.
          </motion.p>

          {/* openers — one click starts the session and asks the question */}
          <motion.ul
            variants={reduced ? undefined : reveal}
            className="mt-6 flex flex-wrap gap-2"
          >
            {PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  onClick={() => ask(prompt)}
                  className="group inline-flex items-center gap-2 rounded-full border border-border-subtle glass px-3.5 py-2 text-left text-[13px] text-muted transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:text-fg active:scale-[0.97]"
                >
                  {prompt}
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-subtle transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal" />
                </button>
              </li>
            ))}
          </motion.ul>

          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-6 max-w-md border-t border-border-subtle pt-4 font-mono text-[11px] leading-relaxed text-subtle"
          >
            Runs on ElevenLabs Conversational AI. Voice goes over WebRTC and
            asks for microphone access first — text mode never touches your mic.
          </motion.p>
        </motion.div>

        {/* ---------- the console ---------- */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 28, scale: 0.98 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative overflow-hidden rounded-[22px] glass-strong p-5 shadow-[0_50px_90px_-60px_rgba(0,0,0,0.95)] sm:p-7"
        >
          <span aria-hidden className="ai-panel-grid pointer-events-none absolute inset-0" />

          {/* console header */}
          <div className="relative flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-subtle">
              assistant · live
            </span>
            <span
              className={clsx(
                "font-mono text-[10px] uppercase tracking-[0.28em] transition-colors duration-500",
                active ? "text-teal" : "text-subtle/70"
              )}
            >
              {active ? "session open" : "standby"}
            </span>
          </div>

          {/* voice or text — the choice that reshapes everything below */}
          <div className="relative mt-5 flex justify-center">
            <ModeToggle />
          </div>

          {/* the stage */}
          <AnimatePresence mode="wait" initial={false}>
            {isVoice ? (
              <motion.div
                key="voice"
                {...stageMotion}
                className="relative mt-6 flex flex-col items-center"
              >
                <AssistantOrb size={92} />
                <p
                  className="mt-4 font-display text-xl font-semibold tracking-tight"
                  aria-live="polite"
                >
                  {phaseLabel(phase, mode)}
                </p>
                <p className="mt-1.5 min-h-9 max-w-xs text-center text-sm text-muted text-pretty">
                  {phaseHint(phase, isMuted, mode)}
                </p>
                <LevelMeter className="mt-1 w-full max-w-sm" />
                {/* Live captions — useful with the sound off, and the only way
                    to follow along if the agent's audio ever drops. */}
                <Transcript
                  className="mt-4 h-40 w-full rounded-2xl border border-border-subtle bg-bg-2/40 p-3.5 sm:h-48"
                  emptyHint="What you both say will appear here."
                />
                <MicrophonePicker className="mt-4" />
              </motion.div>
            ) : (
              <motion.div key="text" {...stageMotion} className="relative mt-6">
                <div className="flex items-center gap-3.5">
                  <AssistantOrb size={56} />
                  <div className="min-w-0">
                    <p
                      className="font-display text-lg font-semibold tracking-tight"
                      aria-live="polite"
                    >
                      {phaseLabel(phase, mode)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted text-pretty">
                      {phaseHint(phase, isMuted, mode)}
                    </p>
                  </div>
                </div>

                <Transcript className="mt-4 h-52 rounded-2xl border border-border-subtle bg-bg-2/40 p-3.5 sm:h-60" />
                <Composer className="mt-3.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* status readout */}
          <div className="relative mt-6 border-t border-border-subtle pt-5">
            <StatusLamps className="justify-center" />
          </div>

          {/* controls */}
          <div className="relative mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={active ? stop : start}
              disabled={connecting}
              className={clsx(
                "group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium transition-[transform,opacity,background-color] duration-300 hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0",
                active
                  ? "border border-border-strong bg-surface-2 text-fg"
                  : "bg-fg text-bg"
              )}
            >
              {active ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  {isVoice ? "End conversation" : "End chat"}
                </>
              ) : (
                <>
                  {isVoice ? (
                    <Mic className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  ) : (
                    <MessageSquareText className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  )}
                  {connecting
                    ? "Connecting…"
                    : isVoice
                      ? "Start voice conversation"
                      : "Start chat"}
                </>
              )}
            </button>

            <AnimatePresence>
              {active && isVoice && (
                <motion.button
                  initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
                  animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onClick={toggleMute}
                  aria-pressed={isMuted}
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-3 text-sm font-medium text-muted transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:text-fg active:scale-[0.97]"
                >
                  {isMuted ? (
                    <MicOff className="h-4 w-4 text-violet" />
                  ) : (
                    <Mic className="h-4 w-4 text-teal" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={reduced ? undefined : { opacity: 0, height: 0 }}
                animate={reduced ? undefined : { opacity: 1, height: "auto" }}
                exit={reduced ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="relative overflow-hidden"
              >
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#f87171]/25 bg-[#f87171]/[0.07] p-4">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#f87171]" />
                  <p className="flex-1 text-sm leading-relaxed text-muted text-pretty">
                    {error}
                  </p>
                  <button
                    onClick={dismissError}
                    aria-label="Dismiss error"
                    className="-m-1 rounded-full p-1 text-subtle transition-colors hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
