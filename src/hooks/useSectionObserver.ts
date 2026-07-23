"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * Active-section detection. Watches every `[data-section]` element and marks the
 * one crossing the viewport's vertical midline as active — reliable with a
 * sticky nav and works no matter how tall each section is.
 *
 * Safe to mount before the sections exist: it simply observes nothing until
 * they're rendered (re-run when `sectionCount` changes to pick them up).
 */
export function useSectionObserver(sectionCount = 0) {
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.section;
            if (id) setActiveSection(id);
          }
        }
      },
      // A 1px band at the vertical middle → exactly one section active at a time.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [setActiveSection, sectionCount]);
}
