"use client";

import { create } from "zustand";

interface UIState {
  /** AI assistant panel open state. */
  assistantOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;

  /**
   * The visitor asked for the floating widget to go away entirely. Held in
   * memory only — deliberately *not* persisted, so a reload offers it again.
   * (Minimising is `assistantOpen: false`; this hides the button too.)
   */
  assistantDismissed: boolean;
  dismissAssistant: () => void;

  /** Section currently in view — powers Nav + ProgressRail. */
  activeSection: string;
  setActiveSection: (id: string) => void;

  /**
   * Gates the hero entrance (and nav / ambient grid) choreography. Defaults to
   * `true` so the whole sequence plays on load; it previously waited on the
   * (now-removed) boot screen being dismissed.
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

  /**
   * Effective colour theme. Hydrated from the `data-theme` the inline boot
   * script set on <html> (localStorage → else OS `prefers-color-scheme`).
   * `explicitTheme` records whether the visitor has overridden the OS: while
   * `false`, the OS listener keeps `theme` in sync; a manual toggle flips it
   * to `true` and persists the choice.
   */
  theme: "light" | "dark";
  explicitTheme: boolean;
  /** Set theme; `explicit` marks it as a persisted user override. */
  setTheme: (value: "light" | "dark", explicit?: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  assistantOpen: false,
  openAssistant: () => set({ assistantOpen: true }),
  closeAssistant: () => set({ assistantOpen: false }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),

  assistantDismissed: false,
  dismissAssistant: () => set({ assistantDismissed: true, assistantOpen: false }),

  activeSection: "home",
  setActiveSection: (id) => set({ activeSection: id }),

  booted: true,
  setBooted: () => set({ booted: true }),

  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  reducedMotion: false,
  setReducedMotion: (value) => set({ reducedMotion: value }),

  // SSR default matches the <html data-theme="dark"> fallback; Providers
  // hydrates the real value from the DOM on mount.
  theme: "dark",
  explicitTheme: false,
  setTheme: (value, explicit = false) =>
    set((s) => ({ theme: value, explicitTheme: explicit || s.explicitTheme })),
  toggleTheme: () =>
    set((s) => ({
      theme: s.theme === "dark" ? "light" : "dark",
      explicitTheme: true,
    })),
}));
