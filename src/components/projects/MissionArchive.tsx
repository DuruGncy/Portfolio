"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Cloud, Gamepad2 } from "lucide-react";
import { projects } from "@/content/projects";
import type { Project } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";
import { ArchitectureFlow } from "./ArchitectureFlow";
import { Pillars } from "./Pillars";
import { ProjectModal } from "./ProjectModal";

function Preview({
  project,
  index,
  onOpen,
  triggerRef,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
  triggerRef: (el: HTMLButtonElement | null) => void;
}) {
  const reduced = useReducedMotion();
  const isViolet = project.accent === "violet";
  const flip = index % 2 === 1; // alternate visual side
  const KindIcon = project.kind === "cloud" ? Cloud : Gamepad2;

  return (
    <motion.article
      initial={reduced ? undefined : { opacity: 0, y: 40 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onClick={onOpen}
      className={clsx(
        "group relative cursor-pointer overflow-hidden rounded-3xl border p-6 transition-[transform,border-color,box-shadow] duration-300 sm:p-9",
        "glass hover:-translate-y-1",
        isViolet
          ? "hover:border-violet/40 hover:shadow-[0_40px_80px_-40px_rgba(167,139,250,0.5)]"
          : "hover:border-teal/40 hover:shadow-[0_40px_80px_-40px_rgba(45,212,191,0.5)]"
      )}
    >
      {/* ambient accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: isViolet
            ? "radial-gradient(60% 60% at 80% 0%, rgba(167,139,250,0.12), transparent 60%)"
            : "radial-gradient(60% 60% at 20% 0%, rgba(45,212,191,0.12), transparent 60%)",
        }}
      />

      {/* oversized index */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-5 top-2 select-none font-display text-8xl font-bold leading-none text-white/[0.03]"
      >
        0{index + 1}
      </span>

      <div
        className={clsx(
          "relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12",
          flip && "lg:[&>*:first-child]:order-2"
        )}
      >
        {/* text */}
        <div>
          <span
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider",
              isViolet
                ? "border-violet/30 bg-violet/10 text-violet"
                : "border-teal/30 bg-teal/10 text-teal"
            )}
          >
            <KindIcon className="h-3.5 w-3.5" />
            {project.kind === "cloud" ? "Cloud · Serverless" : "Game · Systems"}
          </span>

          <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {project.name}
          </h3>
          <p className="mt-2 text-muted">{project.tagline}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted text-pretty">
            {project.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 font-mono text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>

          <button
            ref={triggerRef}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={clsx(
              "mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-[color,background-color,transform] active:scale-[0.97]",
              isViolet
                ? "bg-violet/15 text-violet hover:bg-violet/25"
                : "bg-teal/15 text-teal hover:bg-teal/25"
            )}
            aria-label={`Open ${project.name} case study`}
          >
            Open case study
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* live preview visual */}
        <div className="rounded-2xl border border-border-subtle bg-bg/40 p-5">
          {project.architecture ? (
            <ArchitectureFlow nodes={project.architecture} compact />
          ) : project.pillars ? (
            <Pillars pillars={project.pillars} compact />
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export function MissionArchive() {
  const [active, setActive] = useState<Project | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});

  const close = () => {
    const id = active?.id;
    setActive(null);
    if (id) triggers.current[id]?.focus();
  };

  return (
    <section
      id="mission-archive"
      data-section="mission-archive"
      aria-labelledby="mission-archive-title"
      className="section-pad relative mx-auto max-w-7xl scroll-mt-24 py-28 md:py-36"
    >
      {/* masthead */}
      <div className="mb-14 flex items-center gap-4">
        <h2
          id="mission-archive-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">04 — </span>Projects
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          Case studies
        </p>
      </div>

      <div className="space-y-8">
        {projects.map((p, i) => (
          <Preview
            key={p.id}
            project={p}
            index={i}
            onOpen={() => setActive(p)}
            triggerRef={(el) => {
              triggers.current[p.id] = el;
            }}
          />
        ))}
      </div>

      <ProjectModal project={active} onClose={close} />
    </section>
  );
}
