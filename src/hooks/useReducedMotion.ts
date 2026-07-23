"use client";

import { useUIStore } from "@/store/ui-store";

/** Convenience selector for the effective reduced-motion preference. */
export function useReducedMotion(): boolean {
  return useUIStore((s) => s.reducedMotion);
}
