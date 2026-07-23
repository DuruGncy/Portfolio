"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { GitHubIcon } from "@/components/hero/BrandIcons";
import { ArchitectureFlow } from "./ArchitectureFlow";
import { Pillars } from "./Pillars";
import { clsx } from "@/lib/clsx";

function List({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it} className="flex gap-3 text-sm leading-relaxed text-muted">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
          />
          <span className="text-pretty">{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
        {label}
      </h3>
      {children}
    </section>
  );
}

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { stop, start } = useSmoothScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = project !== null;

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    stop();
    document.body.style.overflow = "hidden";
    return () => {
      start();
      document.body.style.overflow = "";
    };
  }, [open, stop, start]);

  // Focus + Escape + focus trap.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!f || f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const accentColor =
    project?.accent === "violet" ? "var(--violet)" : "var(--teal)";

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* backdrop — the page fades behind */}
          <motion.div
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
          />

          {/* case study — expands to fill the screen */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.name} case study`}
            // Let Lenis leave wheel/touch events alone so this panel scrolls
            // natively while the background is locked.
            data-lenis-prevent
            className="fixed inset-3 z-[90] overflow-y-auto rounded-2xl glass-strong sm:inset-6 lg:inset-10"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* accent top bar */}
            <div
              className="sticky top-0 z-10 h-1 w-full"
              style={{
                background:
                  project.accent === "violet"
                    ? "linear-gradient(90deg,#a78bfa,#6366f1)"
                    : "linear-gradient(90deg,#2dd4bf,#22d3ee)",
              }}
            />

            <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
              {/* header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-subtle">
                    {project.kind === "cloud" ? "Cloud · Serverless" : "Game · Systems"}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                    {project.name}
                  </h2>
                  <p className="mt-2 text-muted">{project.tagline}</p>
                </div>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close case study"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass text-muted transition-[color,transform] hover:text-fg active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* body */}
              <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
                {/* left: written case study */}
                <div className="space-y-9">
                  <Block label="Problem">
                    <p className="text-sm leading-relaxed text-muted text-pretty sm:text-base">
                      {project.problem}
                    </p>
                  </Block>
                  <Block label="Implementation">
                    <List items={project.implementation} accent={accentColor} />
                  </Block>
                  <Block label="Challenges">
                    <List items={project.challenges} accent={accentColor} />
                  </Block>
                  <Block label="Lessons">
                    <List items={project.lessons} accent={accentColor} />
                  </Block>
                </div>

                {/* right: architecture + tech + github */}
                <div className="space-y-9">
                  <Block label="Architecture">
                    {project.architecture ? (
                      <ArchitectureFlow nodes={project.architecture} />
                    ) : project.pillars ? (
                      <Pillars pillars={project.pillars} />
                    ) : null}
                  </Block>

                  <Block label="Technologies">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 font-mono text-xs text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </Block>

                  <Block label="GitHub">
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium text-fg transition-[transform,background-color] hover:-translate-y-0.5 active:scale-[0.97]",
                        project.accent === "violet"
                          ? "border-violet/40 hover:bg-violet/10"
                          : "border-teal/40 hover:bg-teal/10"
                      )}
                    >
                      <GitHubIcon className="h-4 w-4" />
                      View on GitHub
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Block>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
