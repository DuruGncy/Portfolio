"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowUp,
  AudioLines,
  Loader2,
  MessageSquareText,
  Mic,
  MicOff,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";
import {
  useAssistant,
  type AssistantMode,
  type AssistantPhase,
} from "./ElevenLabsConversation";

/**
 * Shared chrome for the assistant — the reactive orb, the status lamps and the
 * level meter. Both the showcase section and the floating widget render these,
 * so a visitor who starts a conversation in one and continues in the other sees
 * exactly the same instrument.
 */

/** Raw volumes sit low; this lifts them into a range that reads on screen. */
const LEVEL_GAIN = 2.2;

/**
 * Subscribes a motion value to the live conversation level. Returns a spring so
 * the orb glides between frames instead of jittering on every rAF tick.
 */
function useLevel() {
  const { active, getLevel } = useAssistant();
  const reduced = useReducedMotion();
  const level = useMotionValue(0);
  const smooth = useSpring(level, { stiffness: 240, damping: 24, mass: 0.35 });

  useEffect(() => {
    if (!active || reduced) {
      level.set(0);
      return;
    }
    let frame = 0;
    const tick = () => {
      level.set(Math.min(1, getLevel() * LEVEL_GAIN));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, getLevel, level]);

  return smooth;
}

/** The accent each phase paints itself in. */
function phaseColor(phase: AssistantPhase): string {
  switch (phase) {
    case "speaking":
      return "var(--violet)";
    case "listening":
      return "var(--teal)";
    case "connecting":
    case "permission":
      return "var(--cyan)";
    case "error":
      return "#f87171";
    default:
      return "var(--fg-subtle)";
  }
}

/* ------------------------------------------------------------------ orb --- */

interface OrbProps {
  /** Diameter in pixels. */
  size?: number;
  className?: string;
}

/**
 * A single instrument that reads at a glance: an aurora ring that turns while a
 * session is live, a core that breathes with whoever is talking, and ripples
 * that only fire while the agent answers. Deliberately not a chat bubble.
 */
export function AssistantOrb({ size = 148, className }: OrbProps) {
  const { phase, active, isMuted, mode } = useAssistant();
  const reduced = useReducedMotion();
  const level = useLevel();

  const coreScale = useTransform(level, [0, 1], [1, 1.14]);
  const haloScale = useTransform(level, [0, 1], [0.92, 1.3]);
  const haloOpacity = useTransform(level, [0, 1], [0.28, 0.85]);

  const color = phaseColor(phase);
  const Icon =
    phase === "error"
      ? TriangleAlert
      : phase === "connecting" || phase === "permission"
        ? Loader2
        : phase === "speaking"
          ? Waves
          : mode === "text"
            ? MessageSquareText
            : isMuted && active
              ? MicOff
              : Mic;

  return (
    <div
      className={clsx("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* soft halo — the only element that tracks the raw level directly */}
      <motion.span
        className="ai-halo absolute inset-0 rounded-full"
        style={
          reduced
            ? { opacity: active ? 0.4 : 0.2 }
            : { scale: haloScale, opacity: haloOpacity }
        }
      />

      {/* ripples — fire only while the agent has the floor */}
      {!reduced && phase === "speaking" && (
        <>
          <span className="ai-ripple absolute inset-[14%] rounded-full border border-[var(--violet)]" />
          <span
            className="ai-ripple absolute inset-[14%] rounded-full border border-[var(--violet)]"
            style={{ animationDelay: "0.85s" }}
          />
        </>
      )}

      {/* aurora ring — turns whenever a session is live */}
      <span
        className={clsx(
          "ai-ring absolute inset-0 rounded-full transition-opacity duration-700",
          active ? "opacity-100" : "opacity-35",
          active && !reduced && "ai-ring--live"
        )}
      />

      {/* core */}
      <motion.span
        style={reduced ? undefined : { scale: coreScale }}
        className="ai-core absolute inset-[13%] grid place-items-center rounded-full"
      >
        <Icon
          className={clsx(
            "transition-colors duration-500",
            phase === "connecting" || phase === "permission" ? "animate-spin" : ""
          )}
          style={{ color, width: size * 0.2, height: size * 0.2 }}
          strokeWidth={1.5}
        />
      </motion.span>

      {/* orbiting spark — a quiet sign of life while idle */}
      {!reduced && (
        <span
          className={clsx(
            "ai-orbit absolute inset-[-3%] rounded-full transition-opacity duration-700",
            active ? "opacity-0" : "opacity-100"
          )}
        >
          <span
            className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
            style={{ background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)" }}
          />
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- lamps --- */

interface LampProps {
  label: string;
  lit: boolean;
  color: string;
}

function Lamp({ label, lit, color }: LampProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300"
        style={{
          background: lit ? color : "var(--border-strong)",
          boxShadow: lit ? `0 0 8px ${color}` : "none",
        }}
      />
      <span
        className={clsx(
          "font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-300",
          lit ? "text-fg" : "text-subtle/60"
        )}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * The four states the visitor is promised, wired as a console readout rather
 * than a single changing word — you can see at a glance what the session is
 * doing and what it *could* be doing.
 *
 * Hidden from assistive tech on purpose: only the lamps' *styling* changes, so
 * a live region here would never fire. The phase label next to it is the live
 * region, and it says the same thing in one word.
 */
export function StatusLamps({ className }: { className?: string }) {
  const { phase, status, active } = useAssistant();

  return (
    <div
      aria-hidden
      className={clsx("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
    >
      <Lamp
        label="Connected"
        lit={status === "connected"}
        color="var(--teal)"
      />
      <Lamp label="Listening" lit={phase === "listening"} color="var(--cyan)" />
      <Lamp label="Speaking" lit={phase === "speaking"} color="var(--violet)" />
      <Lamp
        label="Disconnected"
        lit={!active && status !== "connected"}
        color="var(--fg-subtle)"
      />
    </div>
  );
}

/* ----------------------------------------------------------------- meter --- */

const BARS = 28;

/**
 * A waveform strip under the orb. Each bar has a fixed profile — tall in the
 * middle, short at the edges — scaled by the live level, so it swells and
 * settles like a real meter instead of dancing randomly.
 */
export function LevelMeter({ className }: { className?: string }) {
  const { active } = useAssistant();
  const level = useLevel();

  return (
    <div
      aria-hidden
      className={clsx("flex h-8 items-center justify-center gap-[3px]", className)}
    >
      {Array.from({ length: BARS }, (_, i) => {
        // Bell-ish profile plus a deterministic wobble so no two bars match.
        const centre = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
        const profile = 0.25 + centre * 0.75 * (0.7 + 0.3 * Math.sin(i * 2.4));
        return <Bar key={i} level={level} profile={profile} active={active} />;
      })}
    </div>
  );
}

/* ------------------------------------------------------------ mode toggle --- */

const MODES: { id: AssistantMode; label: string; icon: typeof Mic }[] = [
  { id: "voice", label: "Voice", icon: AudioLines },
  { id: "text", label: "Text", icon: MessageSquareText },
];

/**
 * Voice or text — the choice sits above the controls in both surfaces, because
 * it changes what the whole panel is for. Switching ends any live session, so
 * the label says so while one is running.
 */
export function ModeToggle({ className }: { className?: string }) {
  const { mode, setMode, active, voiceSupported } = useAssistant();
  // Unique per instance: the section and the widget each render one, and a
  // shared layoutId would make the pill fly across the page between them.
  const layoutId = useId();

  return (
    <div
      role="group"
      aria-label="Conversation mode"
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-border-subtle glass p-1",
        className
      )}
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const selected = mode === id;
        // The agent can be set to text-only on elevenlabs.io, in which case a
        // voice session connects but never speaks — don't offer a dead end.
        const unavailable = id === "voice" && voiceSupported === false;
        return (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={selected}
            disabled={unavailable}
            title={
              unavailable
                ? "This agent is set to text-only in its ElevenLabs settings, so it can't speak yet."
                : active
                  ? "Switching mode ends the current session"
                  : undefined
            }
            className={clsx(
              "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300",
              unavailable
                ? "cursor-not-allowed text-subtle/45 line-through decoration-subtle/40"
                : selected
                  ? "text-fg"
                  : "text-subtle hover:text-fg"
            )}
          >
            {selected && !unavailable && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-surface-2 shadow-[0_0_18px_-8px_rgba(34,211,238,0.7)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- mic picker --- */

/**
 * Choose the microphone, and prove it works before trusting it.
 *
 * The test runs entirely locally — no session, no agent — so "she can't hear
 * me" becomes a question you can answer by watching a bar move. Switching the
 * device mid-conversation swaps the input without dropping the call.
 */
export function MicrophonePicker({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { mic, active } = useAssistant();
  const {
    devices,
    deviceId,
    setDeviceId,
    labelsVisible,
    testing,
    startTest,
    stopTest,
    testError,
  } = mic;

  return (
    <div className={clsx("w-full", className)}>
      <div className="flex items-center gap-2">
        <Mic className="h-3.5 w-3.5 shrink-0 text-subtle" />
        <select
          value={deviceId ?? ""}
          onChange={(e) => setDeviceId(e.target.value || null)}
          aria-label="Microphone"
          className="min-w-0 flex-1 truncate rounded-full border border-border-subtle bg-surface/60 px-3 py-2 text-xs text-fg transition-colors duration-300 focus:border-border-strong"
        >
          <option value="">
            {labelsVisible ? "System default" : "Default microphone"}
          </option>
          {devices.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </option>
          ))}
        </select>

        {/* Testing while connected would fight the SDK for the device. */}
        {!active && (
          <button
            type="button"
            onClick={testing ? stopTest : startTest}
            aria-pressed={testing}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 active:scale-95",
              testing
                ? "border-teal/50 text-teal"
                : "border-border-subtle text-muted hover:border-border-strong hover:text-fg"
            )}
          >
            {testing ? "Stop test" : "Test"}
          </button>
        )}
      </div>

      {/* live level from the local test stream */}
      <AnimatePresence>
        {testing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2.5">
              <TestLevelBar getLevel={mic.getTestLevel} />
              {!compact && (
                <p className="mt-2 text-center text-[11px] text-subtle">
                  Say something — the bar should move.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {testError && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#f87171]">
          {testError}
        </p>
      )}

      {!labelsVisible && !testing && !active && !compact && (
        <p className="mt-2 text-[11px] leading-relaxed text-subtle">
          Hit Test to allow access — your microphones are only named once the
          browser has granted permission.
        </p>
      )}
    </div>
  );
}

/** A single meter driven straight off the test analyser. */
function TestLevelBar({ getLevel }: { getLevel: () => number }) {
  const level = useMotionValue(0);
  const smooth = useSpring(level, { stiffness: 300, damping: 28, mass: 0.3 });
  const width = useTransform(smooth, [0, 1], ["2%", "100%"]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      level.set(getLevel());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [getLevel, level]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <motion.div
        style={{ width, background: "var(--aurora)" }}
        className="h-full rounded-full"
      />
    </div>
  );
}

/* ------------------------------------------------------------- transcript --- */

/**
 * The running conversation. Shown in text mode; in voice mode the same data is
 * available but the orb carries the state, so callers decide whether to render
 * it.
 */
export function Transcript({
  className,
  emptyHint = "Ask anything — the answer appears here.",
}: {
  className?: string;
  emptyHint?: string;
}) {
  const { messages, phase } = useAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pin to the newest turn. Scrolling the container directly (rather than
  // `scrollIntoView`) keeps Lenis from dragging the whole page along.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, phase]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation transcript"
      className={clsx(
        "flex flex-col gap-2.5 overflow-y-auto overscroll-contain scroll-smooth pr-1",
        className
      )}
    >
      {messages.length === 0 ? (
        <p className="m-auto max-w-[22ch] text-center text-xs text-subtle text-pretty">
          {emptyHint}
        </p>
      ) : (
        messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-pretty",
              m.role === "user"
                ? "self-end rounded-br-md bg-surface-2 text-fg"
                : "self-start rounded-bl-md border border-border-subtle glass text-muted"
            )}
          >
            {m.text}
          </div>
        ))
      )}

      {/* the agent is composing — three dots in the agent's bubble slot */}
      {phase === "speaking" && (
        <div className="self-start rounded-2xl rounded-bl-md border border-border-subtle glass px-3.5 py-3">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="ai-typing-dot h-1.5 w-1.5 rounded-full bg-teal"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- composer --- */

/** The text input. Disabled until a session is open, so it can't silently fail. */
export function Composer({ className }: { className?: string }) {
  const { send, status, active, start } = useAssistant();
  const [text, setText] = useState("");
  const connected = status === "connected";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!connected) return;
    send(text);
    setText("");
  }

  return (
    <form onSubmit={submit} className={clsx("flex items-center gap-2", className)}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!connected}
        placeholder={
          connected ? "Type your question…" : "Start a session to type…"
        }
        aria-label="Message the assistant"
        className="min-w-0 flex-1 rounded-full border border-border-subtle bg-surface/60 px-4 py-2.5 text-sm text-fg placeholder:text-subtle transition-colors duration-300 focus:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
      />
      {connected ? (
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fg text-bg transition-[transform,opacity] duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={active}
          aria-label="Start the session"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border-subtle text-muted transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:text-fg active:scale-95 disabled:cursor-wait disabled:opacity-50"
        >
          <MessageSquareText className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

function Bar({
  level,
  profile,
  active,
}: {
  level: MotionValue<number>;
  profile: number;
  active: boolean;
}) {
  const height = useTransform(level, [0, 1], [3, 3 + profile * 26]);
  const opacity = useTransform(level, [0, 1], [0.25, 1]);

  return (
    <motion.span
      style={{
        height,
        opacity: active ? opacity : 0.2,
        background: "var(--aurora)",
      }}
      className="w-[2px] rounded-full"
    />
  );
}
