"use client";

import { useEffect, useRef } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { AssistantSnapshot, EngineControls } from "./ElevenLabsConversation";
import { AGENT_ID } from "./agent";

/**
 * The only module that imports `@elevenlabs/react`. It is loaded on demand (see
 * `ElevenLabsConversation.tsx`) so the LiveKit/WebRTC bundle stays out of the
 * initial page load, and it renders nothing — it exists purely to translate the
 * SDK's hook state into the flat snapshot the UI layer consumes.
 */

export interface AssistantEngineProps {
  /** The visitor's intent. The bridge opens/closes the session to match. */
  open: boolean;
  /** Text sessions skip audio entirely; the SDK routes them over WebSocket. */
  textOnly: boolean;
  /** Chosen microphone, or `null` for the browser default. */
  inputDeviceId: string | null;
  onSnapshot: (snapshot: AssistantSnapshot) => void;
  onReady: (controls: EngineControls) => void;
  onConnected: () => void;
  onMessage: (role: "user" | "agent", text: string) => void;
  onError: (message: string) => void;
  onEnded: () => void;
}

export function AssistantEngine(props: AssistantEngineProps) {
  // `useConversation` requires a provider ancestor, so the bridge is a child.
  return (
    <ConversationProvider>
      <EngineBridge {...props} />
    </ConversationProvider>
  );
}

function EngineBridge({
  open,
  textOnly,
  inputDeviceId,
  onSnapshot,
  onReady,
  onConnected,
  onMessage,
  onError,
  onEnded,
}: AssistantEngineProps) {
  const {
    status,
    isSpeaking,
    isListening,
    isMuted,
    startSession,
    endSession,
    setMuted,
    sendUserMessage,
    changeInputDevice,
    getInputVolume,
    getOutputVolume,
  } = useConversation({
    // The hook keeps these fresh across renders, so plain closures are safe.
    onConnect: () => onConnected(),
    onDisconnect: () => onEnded(),
    onMessage: ({ message, role, source }) =>
      onMessage(role ?? (source === "ai" ? "agent" : "user"), message),
    onError: (message) =>
      onError(message || "The session dropped unexpectedly."),
  });

  // Mirror SDK state upward so no UI component ever imports ElevenLabs.
  useEffect(() => {
    onSnapshot({ status, isSpeaking, isListening, isMuted });
  }, [status, isSpeaking, isListening, isMuted, onSnapshot]);

  // Hand over the imperative controls. Every reference here is stable, so this
  // effectively runs once.
  useEffect(() => {
    onReady({ setMuted, sendUserMessage, getInputVolume, getOutputVolume });
  }, [onReady, setMuted, sendUserMessage, getInputVolume, getOutputVolume]);

  // Read at session-open time only — putting the device in the session effect's
  // deps would tear the conversation down every time it changed.
  const deviceRef = useRef(inputDeviceId);
  useEffect(() => {
    deviceRef.current = inputDeviceId;
  }, [inputDeviceId]);

  // Swap microphone mid-conversation, without dropping the session.
  const appliedDeviceRef = useRef(inputDeviceId);
  useEffect(() => {
    if (appliedDeviceRef.current === inputDeviceId) return;
    appliedDeviceRef.current = inputDeviceId;
    if (textOnly || status !== "connected") return;
    changeInputDevice({ inputDeviceId: inputDeviceId ?? undefined }).catch(
      () => onError("Could not switch to that microphone.")
    );
  }, [inputDeviceId, textOnly, status, changeInputDevice, onError]);

  // The session's lifetime is owned by this effect: it opens while `open` is
  // true and is torn down by the cleanup.
  //
  // The `setTimeout` is load-bearing, not a hack for timing. React's Strict
  // Mode remounts effects once in development, and the SDK's provider ends the
  // session on unmount while *refusing* to start another one until its connect
  // promise settles — so a start issued synchronously here gets killed by the
  // simulated unmount and can never come back. Deferring by a macrotask means
  // the simulated unmount cancels a pending start instead of a live session.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      startSession(
        textOnly
          ? { agentId: AGENT_ID, connectionType: "websocket", textOnly: true }
          : {
              agentId: AGENT_ID,
              connectionType: "webrtc",
              ...(deviceRef.current
                ? { inputDeviceId: deviceRef.current }
                : null),
            }
      );
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      endSession();
    };
  }, [open, textOnly, startSession, endSession]);

  return null;
}
