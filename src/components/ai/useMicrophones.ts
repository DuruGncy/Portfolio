"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Microphone selection and a local input test.
 *
 * Nothing here touches ElevenLabs — it is plain `mediaDevices` plumbing, kept
 * separate so the assistant's session logic stays about the session. The test
 * path deliberately runs entirely in the browser: no connection, no agent, just
 * "is this device picking up my voice?", which is the only way to answer that
 * question without guessing.
 */

export interface MicrophoneApi {
  /** Available audio inputs. Labels are blank until permission is granted. */
  devices: MediaDeviceInfo[];
  /** Chosen input, or `null` to follow the browser's default. */
  deviceId: string | null;
  setDeviceId: (id: string | null) => void;
  /** True once labels are readable, i.e. the visitor has allowed the mic. */
  labelsVisible: boolean;
  /** A local level check is running. */
  testing: boolean;
  startTest: () => void;
  stopTest: () => void;
  /** Live input level from the test stream, 0–1. Read inside a rAF loop. */
  getTestLevel: () => number;
  testError: string | null;
}

/** Raw levels sit low; this lifts speech into a range that reads on screen. */
const TEST_GAIN = 2.4;

export function useMicrophones(): MicrophoneApi {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceIdState] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const labelsVisible = devices.some((d) => d.label !== "");

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "audioinput" && d.deviceId));
    } catch {
      /* enumeration blocked — leave the list as it is */
    }
  }, []);

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
  }, []);

  const stopTest = useCallback(() => {
    teardown();
    setTesting(false);
  }, [teardown]);

  const openTest = useCallback(
    async (id: string | null) => {
      teardown();
      setTestError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: id ? { deviceId: { exact: id } } : true,
        });
        streamRef.current = stream;

        const context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        context.createMediaStreamSource(stream).connect(analyser);

        contextRef.current = context;
        analyserRef.current = analyser;
        bufferRef.current = new Uint8Array(analyser.frequencyBinCount);

        setTesting(true);
        // Labels only become readable once access has been granted, so this is
        // the moment the picker actually becomes useful.
        await refresh();
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        teardown();
        setTesting(false);
        setTestError(
          name === "NotAllowedError" || name === "SecurityError"
            ? "Microphone access was blocked. Allow it in your browser's address bar."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "That microphone is no longer available. Pick another one."
              : "Could not open that microphone."
        );
      }
    },
    [refresh, teardown]
  );

  const startTest = useCallback(() => {
    void openTest(deviceId);
  }, [openTest, deviceId]);

  /** Switching device mid-test re-opens the stream on the new one. */
  const setDeviceId = useCallback(
    (id: string | null) => {
      setDeviceIdState(id);
      if (testing) void openTest(id);
    },
    [testing, openTest]
  );

  const getTestLevel = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    if (!analyser || !buffer) return 0;
    analyser.getByteFrequencyData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i];
    return Math.min(1, (sum / buffer.length / 255) * TEST_GAIN);
  }, []);

  // Devices come and go (headsets, docks) — keep the list honest.
  useEffect(() => {
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : null;
    if (!md?.addEventListener) return;

    let subscribed = true;
    const sync = () => {
      if (subscribed) void refresh();
    };
    // The first read is part of subscribing, not state derived from render, so
    // it is deferred off the effect body.
    const initial = setTimeout(sync, 0);
    md.addEventListener("devicechange", sync);

    return () => {
      subscribed = false;
      clearTimeout(initial);
      md.removeEventListener("devicechange", sync);
    };
  }, [refresh]);

  // Never leave a hot microphone behind.
  useEffect(() => teardown, [teardown]);

  return {
    devices,
    deviceId,
    setDeviceId,
    labelsVisible,
    testing,
    startTest,
    stopTest,
    getTestLevel,
    testError,
  };
}
