"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchVoiceSupport, type VoiceSupport } from "./agent";
import { useMicrophones, type MicrophoneApi } from "./useMicrophones";

/**
 * The ElevenLabs *logic* layer. Nothing in here renders chrome — it owns the
 * conversation and publishes one flat, UI-friendly value through context so
 * `AISection` and `FloatingAssistant` can share a single live session (starting
 * one in the section and scrolling down to the floating widget must never open
 * a second connection).
 *
 * The SDK itself — `@elevenlabs/react` and the LiveKit stack it pulls in — is
 * several hundred kB, far too much to ship on first paint for a feature most
 * visitors never touch. So the engine lives in its own chunk and is only
 * mounted once the visitor actually asks to talk. That's what `armed` tracks:
 * it latches on at the first `start()` and stays on, so a second conversation
 * opens instantly.
 */

/** How the visitor wants to converse. */
export type AssistantMode = "voice" | "text";

/** Session lifecycle flattened into a single value the UI can switch on. */
export type AssistantPhase =
  | "idle" // nothing running — the visitor sees "Disconnected"
  | "permission" // waiting on the browser's microphone prompt
  | "connecting" // handshake in flight
  | "listening" // session open, the visitor has the floor
  | "speaking" // session open, the agent has the floor
  | "error";

/** Raw connection state, mirrored up from the SDK. */
export type AssistantStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** One turn of the conversation, for the text transcript. */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

/** What the engine pushes up on every ElevenLabs state change. */
export interface AssistantSnapshot {
  status: AssistantStatus;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
}

/** Imperative handles the engine hands over once it has mounted. */
export interface EngineControls {
  setMuted: (muted: boolean) => void;
  sendUserMessage: (text: string) => void;
  /** Live output level, 0–1. Drives the orb while the agent talks. */
  getOutputVolume: () => number;
  /** Live input level, 0–1. Drives the orb while the visitor talks. */
  getInputVolume: () => number;
}

export interface AssistantApi {
  mode: AssistantMode;
  /** Switching modes ends any live session — they are separate conversations. */
  setMode: (mode: AssistantMode) => void;
  phase: AssistantPhase;
  status: AssistantStatus;
  /** True from the moment the handshake starts until the session closes. */
  active: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  error: string | null;
  /** The running transcript. Populated in both modes. */
  messages: ChatMessage[];
  /** Whichever side currently holds the floor, 0–1. Read inside rAF loops. */
  getLevel: () => number;
  start: () => void;
  stop: () => void;
  toggleMute: () => void;
  /**
   * Whether the agent can actually speak. `false` when it is configured
   * text-only on elevenlabs.io — a voice session would connect and then sit in
   * silence, so the UI says so instead of pretending. `null` while unknown.
   */
  voiceSupported: VoiceSupport;
  /** Microphone selection + a local input test. */
  mic: MicrophoneApi;
  /** Send a typed message. No-op unless a session is open. */
  send: (text: string) => void;
  /**
   * Put a question to the agent. If no session is open yet this starts one and
   * asks as soon as it connects — so a suggested-question chip is a one-click
   * entry into the conversation, in either mode.
   */
  ask: (text: string) => void;
  dismissError: () => void;
}

const IDLE_SNAPSHOT: AssistantSnapshot = {
  status: "disconnected",
  isSpeaking: false,
  isListening: false,
  isMuted: false,
};

/** Let the agent's greeting land before a queued question is sent. */
const PENDING_QUESTION_DELAY = 700;

const AssistantContext = createContext<AssistantApi | null>(null);

/** Loaded on demand — see the note at the top of this file. */
const AssistantEngine = dynamic(
  () => import("./assistant-engine").then((m) => m.AssistantEngine),
  { ssr: false }
);

let messageSeq = 0;
const nextId = () => `m${++messageSeq}`;

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  /** Has the heavy SDK chunk been mounted yet? Latches on, never off. */
  const [armed, setArmed] = useState(false);
  /** The visitor's intent — the engine opens/closes the session to match. */
  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState<AssistantMode>("voice");
  /** True only while the browser's microphone prompt is up. */
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AssistantSnapshot>(IDLE_SNAPSHOT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceSupported, setVoiceSupported] = useState<VoiceSupport>(null);
  const mic = useMicrophones();

  // Ask the agent what it can do. One small unauthenticated GET; if it says the
  // agent is text-only we switch the visitor over rather than letting them talk
  // into a session that will never answer out loud.
  useEffect(() => {
    const controller = new AbortController();
    fetchVoiceSupport(controller.signal).then((supported) => {
      if (controller.signal.aborted || supported === null) return;
      setVoiceSupported(supported);
      if (!supported) setModeState("text");
    });
    return () => controller.abort();
  }, []);

  const controlsRef = useRef<EngineControls | null>(null);
  const pendingRef = useRef<string | null>(null);
  /**
   * Text we already put in the transcript ourselves. The server echoes typed
   * messages back as user transcripts, so we drop the first echo of each rather
   * than showing it twice.
   */
  const echoGuardRef = useRef<string[]>([]);

  // --- engine → provider ---------------------------------------------------

  const handleSnapshot = useCallback((next: AssistantSnapshot) => {
    setSnapshot(next);
  }, []);

  const handleReady = useCallback((controls: EngineControls) => {
    controlsRef.current = controls;
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message || "The session dropped. Give it another go.");
    setOpen(false);
    pendingRef.current = null;
  }, []);

  const handleEnded = useCallback(() => {
    setOpen(false);
    setSnapshot(IDLE_SNAPSHOT);
    pendingRef.current = null;
  }, []);

  /** Id is minted outside the updater so React can re-run it safely. */
  const appendMessage = useCallback((role: "user" | "agent", text: string) => {
    const message: ChatMessage = { id: nextId(), role, text };
    setMessages((prev) => [...prev, message]);
  }, []);

  /** Incoming turns from the agent — including transcripts of what we said. */
  const handleMessage = useCallback(
    (role: "user" | "agent", text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (role === "user") {
        const i = echoGuardRef.current.indexOf(trimmed);
        if (i !== -1) {
          echoGuardRef.current.splice(i, 1);
          return;
        }
      }
      appendMessage(role, trimmed);
    },
    [appendMessage]
  );

  /** Fired once the session is live — flush a question queued before connect. */
  const handleConnected = useCallback(() => {
    const question = pendingRef.current;
    if (!question) return;
    pendingRef.current = null;
    window.setTimeout(() => {
      controlsRef.current?.sendUserMessage(question);
    }, PENDING_QUESTION_DELAY);
  }, []);

  // --- UI → engine ---------------------------------------------------------

  /**
   * Opens a session, optionally with a question queued for the moment it
   * connects. `start` and `ask` both funnel through here so the transcript
   * reset and the queued turn can never get out of order.
   */
  const beginSession = useCallback(
    async (queued?: string) => {
      if (open || requesting) return;
      setError(null);

      // Each session is a genuinely new conversation — the agent carries
      // nothing over from the last one, so neither should the transcript.
      setMessages([]);
      echoGuardRef.current = [];
      pendingRef.current = queued ?? null;
      if (queued) {
        // Show the question straight away, and expect the server to echo it
        // back as a user transcript we should then ignore.
        echoGuardRef.current.push(queued);
        appendMessage("user", queued);
      }

      /** Roll back the optimistic transcript when the session never opens. */
      const abort = (message: string) => {
        setRequesting(false);
        pendingRef.current = null;
        echoGuardRef.current = [];
        setMessages([]);
        setError(message);
      };

      // Text sessions never touch the microphone, so skip the prompt entirely.
      if (mode === "voice") {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          abort(
            "This browser can't capture microphone audio. Switch to text, or try Chrome/Edge/Safari over HTTPS."
          );
          return;
        }

        // Ask for the microphone before spinning anything up. The SDK would
        // request it anyway, but doing it here means a declined prompt produces
        // a sentence the visitor can act on instead of a silently dead session.
        // Release the local level test, if one is running, before the SDK
        // opens its own capture on the same device.
        mic.stopTest();

        setRequesting(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: mic.deviceId ? { deviceId: { exact: mic.deviceId } } : true,
          });
          // We only wanted the grant; the SDK opens its own track.
          stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          const name = e instanceof DOMException ? e.name : "";
          abort(
            name === "NotAllowedError" || name === "SecurityError"
              ? "Microphone access was blocked. Allow it in your browser's address bar, or switch to text."
              : name === "NotFoundError" || name === "OverconstrainedError"
                ? "That microphone isn't available any more. Pick another one below."
                : "No microphone available. Connect one, or switch to text."
          );
          return;
        }
        setRequesting(false);
      }

      setArmed(true);
      setOpen(true);
    },
    [open, requesting, mode, appendMessage, mic]
  );

  const start = useCallback(() => void beginSession(), [beginSession]);

  const stop = useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  /** A mode switch is a new conversation, so it closes whatever is running. */
  const setMode = useCallback((next: AssistantMode) => {
    setModeState((current) => {
      if (current === next) return current;
      pendingRef.current = null;
      setOpen(false);
      setError(null);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    controlsRef.current?.setMuted(!snapshot.isMuted);
  }, [snapshot.isMuted]);

  /**
   * Show it immediately, then send it — typing should never feel laggy. Note
   * this appends *directly*: routing it through `handleMessage` would hit the
   * echo guard we just armed and swallow the visitor's own message.
   */
  const deliver = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      echoGuardRef.current.push(trimmed);
      appendMessage("user", trimmed);
      controlsRef.current?.sendUserMessage(trimmed);
    },
    [appendMessage]
  );

  const send = useCallback(
    (text: string) => {
      if (snapshot.status !== "connected") return;
      deliver(text);
    },
    [snapshot.status, deliver]
  );

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (snapshot.status === "connected") {
        deliver(trimmed);
        return;
      }
      void beginSession(trimmed);
    },
    [snapshot.status, deliver, beginSession]
  );

  const dismissError = useCallback(() => setError(null), []);

  const getLevel = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return 0;
    return snapshot.isSpeaking
      ? controls.getOutputVolume()
      : controls.getInputVolume();
  }, [snapshot.isSpeaking]);

  const phase: AssistantPhase = useMemo(() => {
    if (error) return "error";
    if (requesting) return "permission";
    if (snapshot.status === "connecting") return "connecting";
    if (snapshot.status === "connected") {
      return snapshot.isSpeaking ? "speaking" : "listening";
    }
    // `open` covers the beat between the click and the SDK reporting in.
    return open ? "connecting" : "idle";
  }, [error, requesting, snapshot.status, snapshot.isSpeaking, open]);

  const value = useMemo<AssistantApi>(
    () => ({
      mode,
      setMode,
      phase,
      status: snapshot.status,
      active: open || snapshot.status === "connected",
      isSpeaking: snapshot.isSpeaking,
      isMuted: snapshot.isMuted,
      error,
      messages,
      voiceSupported,
      mic,
      getLevel,
      start,
      stop,
      toggleMute,
      send,
      ask,
      dismissError,
    }),
    [
      mode,
      setMode,
      phase,
      snapshot.status,
      snapshot.isSpeaking,
      snapshot.isMuted,
      open,
      error,
      messages,
      voiceSupported,
      mic,
      getLevel,
      start,
      stop,
      toggleMute,
      send,
      ask,
      dismissError,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>
      {armed && (
        <AssistantEngine
          open={open}
          textOnly={mode === "text"}
          inputDeviceId={mic.deviceId}
          onSnapshot={handleSnapshot}
          onReady={handleReady}
          onConnected={handleConnected}
          onMessage={handleMessage}
          onError={handleError}
          onEnded={handleEnded}
        />
      )}
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantApi {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within an <AssistantProvider>");
  }
  return ctx;
}

/**
 * Human-readable label per phase. Text sessions borrow the same phases, so the
 * two "who has the floor" states are renamed to something that makes sense
 * without a microphone.
 */
export function phaseLabel(phase: AssistantPhase, mode: AssistantMode = "voice"): string {
  switch (phase) {
    case "permission":
      return "Awaiting mic";
    case "connecting":
      return "Connecting";
    case "listening":
      return mode === "text" ? "Ready" : "Listening";
    case "speaking":
      return mode === "text" ? "Replying" : "Speaking";
    case "error":
      return "Error";
    default:
      return "Disconnected";
  }
}

/** One line of guidance under the status, so the state is never just a word. */
export function phaseHint(
  phase: AssistantPhase,
  muted: boolean,
  mode: AssistantMode = "voice"
): string {
  switch (phase) {
    case "permission":
      return "Allow microphone access in your browser.";
    case "connecting":
      return "Opening a secure channel…";
    case "listening":
      if (mode === "text") return "Type a question and hit send.";
      return muted ? "Your mic is muted — unmute to reply." : "Go ahead — I'm listening.";
    case "speaking":
      return mode === "text"
        ? "Writing an answer…"
        : "The agent is answering. Just talk to interrupt.";
    case "error":
      return "Something got in the way.";
    default:
      return mode === "text"
        ? "Start a session to type with the agent."
        : "Start a session to talk out loud.";
  }
}
