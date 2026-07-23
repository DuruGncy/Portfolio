"use client";

import { create } from "zustand";

interface UIState {
  /** AI assistant panel open state. */
  assistantOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;

  /** Section currently in view — powers Nav + ProgressRail. */
  activeSection: string;
  setActiveSection: (id: string) => void;

  /**
   * Flips `true` the moment the boot screen is dismissed. This is the single
   * cue the hero entrance (and nav / ambient grid) waits on, so the whole
   * choreography plays *after* the overlay clears rather than invisibly
   * underneath it.
   */
  booted: boolean;
  setBooted: () => void;

  /** For future ambient / AI audio. */
  soundEnabled: boolean;
  toggleSound: () => void;

  /**
   * Effective reduced-motion preference. Hydrated from `matchMedia`
   * and user-overridable via the in-UI toggle.
   */
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  assistantOpen: false,
  openAssistant: () => set({ assistantOpen: true }),
  closeAssistant: () => set({ assistantOpen: false }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),

  activeSection: "home",
  setActiveSection: (id) => set({ activeSection: id }),

  booted: false,
  setBooted: () => set({ booted: true }),

  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  reducedMotion: false,
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));
