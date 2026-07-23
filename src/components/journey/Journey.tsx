"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import {
  BookOpen,
  Users,
  Database,
  Plane,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { timeline } from "@/content/timeline";
import type { TimelineEntry } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

// Per-entry visual identity (icon + photo gradient).
const META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; gradient: string }
> = {
  "start-degree": { icon: BookOpen, gradient: "linear-gradient(135deg,#4f46e5,#1e1b4b)" },
  ambassador: { icon: Users, gradient: "linear-gradient(135deg,#0d9488,#134e4a)" },
  internship: { icon: Database, gradient: "linear-gradient(135deg,#0891b2,#0c4a6e)" },
  erasmus: { icon: Plane, gradient: "linear-gradient(135deg,#7c3aed,#2e1065)" },
  graduation: { icon: GraduationCap, gradient: "linear-gradient(135deg,#2dd4bf,#7c3aed)" },
};

function Milestone({ entry, index }: { entry: TimelineEntry; index: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  const active = inView && !reduced;
  const lit = reduced || active;

  const meta = META[entry.id] ?? { icon: BookOpen, gradient: "" };
  const Icon = meta.icon;
  const left = index % 2 === 0; // side on desktop
  const milestone = entry.milestone;
  const year = entry.date.match(/\d{4}/)?.[0] ?? "";

  return (
    <div ref={ref} className="relative">
      {/* Node on the line */}
      <span className="absolute left-6 top-1 z-10 -translate-x-1/2 lg:left-1/2">
        <span
          className={clsx(
            "relative flex items-center justify-center rounded-full border transition-[border-color,box-shadow,background-color] duration-500",
            milestone ? "h-11 w-11" : "h-8 w-8",
            lit
              ? "border-cyan bg-surface shadow-[0_0_22px_2px_rgba(34,211,238,0.55)]"
              : "border-border-subtle bg-surface"
          )}
        >
          {active && (
            <span className="absolute inset-0 animate-ping rounded-full border border-cyan/70" />
          )}
          <Icon
            className={clsx(
              milestone ? "h-5 w-5" : "h-4 w-4",
              lit ? "text-cyan" : "text-subtle"
            )}
          />
        </span>
      </span>

      {/* Card */}
      <motion.div
        initial={reduced ? undefined : { opacity: 0, x: left ? -40 : 40, y: 16 }}
        whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={clsx(
          "ml-16 flex flex-col lg:ml-0",
          left
            ? "lg:mr-[54%] lg:items-end lg:text-right"
            : "lg:ml-[54%] lg:items-start lg:text-left"
        )}
      >
        {/* Photo (expands slightly when active) */}
        <motion.div
          animate={reduced ? undefined : { scale: active ? 1.04 : 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={clsx(
            "relative w-full max-w-sm overflow-hidden rounded-xl border p-1.5 transition-colors duration-500",
            lit ? "border-cyan/40 bg-surface" : "border-border-subtle bg-surface"
          )}
        >
          <div
            className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg"
            style={{ background: meta.gradient }}
          >
            {entry.image ? (
              // Real photo fills the frame; the gradient stays behind it as a
              // tint while it loads. sizes tracks the max-w-sm (≈384px) card.
              <Image
                src={entry.image}
                alt={entry.role}
                fill
                sizes="(max-width: 1024px) 100vw, 384px"
                className="object-cover"
              />
            ) : (
              /* emblem — icon set in a designed ring */
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20">
                <span
                  aria-hidden
                  className="absolute inset-0 scale-[1.3] rounded-full border border-white/10"
                />
                <Icon className="h-6 w-6 text-white/75" />
              </span>
            )}
            {year && (
              <span className="absolute right-2 top-2 rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] tabular-nums tracking-wider text-white/70">
                {year}
              </span>
            )}
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_55%,rgba(0,0,0,0.4))]" />
            {/* active sheen */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.18),transparent)]"
              animate={reduced ? undefined : { opacity: active ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.div>

        {/* Text */}
        <div className="mt-4 max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {entry.date}
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-fg">
            {entry.role}
          </h3>
          {entry.org && (
            <p className="mt-1 text-sm text-muted">{entry.org}</p>
          )}
          {entry.location && (
            <p
              className={clsx(
                "mt-1.5 inline-flex items-center gap-1.5 font-mono text-xs text-subtle",
                left && "lg:flex-row-reverse"
              )}
            >
              <MapPin className="h-3 w-3" />
              {entry.location}
            </p>
          )}
          {entry.bullets && (
            <div
              className={clsx(
                "mt-3 flex flex-wrap gap-1.5",
                left && "lg:justify-end"
              )}
            >
              {entry.bullets.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border-subtle bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function Journey() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-driven fill of the glowing line.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.35"],
  });
  const fill = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <section
      id="journey"
      data-section="journey"
      aria-labelledby="journey-title"
      className="section-pad relative mx-auto max-w-7xl scroll-mt-24 py-28 md:py-36"
    >
      {/* masthead */}
      <div className="mb-16 flex items-center gap-4">
        <h2
          id="journey-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">03 — </span>Journey
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          2022 → 2026
        </p>
      </div>

      <div ref={containerRef} className="relative">
        {/* line track */}
        <span
          aria-hidden
          className="absolute left-6 top-0 h-full w-px -translate-x-1/2 bg-border-subtle lg:left-1/2"
        />
        {/* glowing blue fill */}
        <motion.span
          aria-hidden
          style={reduced ? { scaleY: 1 } : { scaleY: fill }}
          className="absolute left-6 top-0 h-full w-[2px] -translate-x-1/2 origin-top bg-gradient-to-b from-teal via-cyan to-indigo shadow-[0_0_18px_2px_rgba(34,211,238,0.5)] lg:left-1/2"
        />

        <div className="space-y-16 lg:space-y-24">
          {timeline.map((entry, i) => (
            <Milestone key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
