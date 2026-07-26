"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Code2,
  Cloud,
  Database,
  Layers,
  Wrench,
  LayoutGrid,
  MousePointerClick,
  ArrowDownToLine,
  RotateCcw,
} from "lucide-react";
import { skills, skillDescriptions } from "@/content/skills";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SectionIndex } from "@/components/ui/SectionIndex";
import { clsx } from "@/lib/clsx";
import { PhysicsDrop, PHYSICS_BODY_ATTR } from "@/components/ui/PhysicsDrop";

// Category identity: icon + accent colour.
const CATEGORY_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  Programming: { icon: Code2, color: "#22d3ee" },
  Cloud: { icon: Cloud, color: "#2dd4bf" },
  Databases: { icon: Database, color: "#a78bfa" },
  Frameworks: { icon: Layers, color: "#818cf8" },
  Tools: { icon: Wrench, color: "#38bdf8" },
};

interface FlatSkill {
  name: string;
  category: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_SKILLS: FlatSkill[] = skills.flatMap((cat) =>
  cat.skills.map((name) => ({
    name,
    category: cat.name,
    description: skillDescriptions[name] ?? "",
    color: CATEGORY_META[cat.name]?.color ?? "#22d3ee",
    icon: CATEGORY_META[cat.name]?.icon ?? Code2,
  })),
);

const TABS = [
  { id: "All", icon: LayoutGrid, count: ALL_SKILLS.length },
  ...skills.map((c) => ({
    id: c.name,
    icon: CATEGORY_META[c.name]?.icon ?? Code2,
    count: c.skills.length,
  })),
];

const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// The cloud's first appearance is staggered and viewport-gated so the entrance
// plays when the user reaches Skills — not off-screen at page load. On a later
// filter change the container is already "show", so newly-mounted chips just
// spring in individually (no stagger), which is the right feel for filtering.
const chipCloud: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export function Skills() {
  const reduced = useReducedMotion();
  const [category, setCategory] = useState("All");
  const [active, setActive] = useState<FlatSkill | null>(null);
  const [dropped, setDropped] = useState(false);

  const reset = useCallback(() => setDropped(false), []);

  const filtered = useMemo(
    () =>
      category === "All"
        ? ALL_SKILLS
        : ALL_SKILLS.filter((s) => s.category === category),
    [category],
  );

  const DetailIcon = active?.icon ?? MousePointerClick;

  return (
    <section
      id="skills"
      data-section="skills"
      aria-labelledby="skills-title"
      className="section-pad relative mx-auto max-w-[100rem] scroll-mt-24 py-28 md:py-36"
    >
      <SectionIndex>06</SectionIndex>

      {/* masthead */}
      <div className="relative mb-12 flex items-center gap-4">
        <h2
          id="skills-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">06 — </span>Skills
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          The toolkit
        </p>
      </div>

      {/* filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const activeTab = category === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              aria-pressed={activeTab}
              // Filtering mounts and unmounts chips, which would pull bodies out
              // from under the running simulation. Reset first.
              disabled={dropped}
              className={clsx(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-[color,transform,opacity] duration-200 active:scale-[0.97]",
                activeTab ? "text-fg" : "text-subtle hover:text-fg",
                dropped && "pointer-events-none opacity-40",
              )}
            >
              {activeTab && (
                <motion.span
                  layoutId="skill-tab"
                  className="absolute inset-0 -z-10 rounded-full aurora-border"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4" />
              {tab.id}
              <span
                className={clsx(
                  "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                  activeTab
                    ? "bg-surface-2 text-muted"
                    : "bg-surface-2/60 text-subtle",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {/* The whole point of this control is the motion, so it has nothing to
            offer a visitor who asked for less of it. */}
        {!reduced && (
          <button
            type="button"
            onClick={() => setDropped((d) => !d)}
            className="group ml-auto flex shrink-0 items-center gap-2 rounded-full glass px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle transition-[color,transform] duration-200 hover:text-fg active:scale-[0.97]"
          >
            {dropped ? (
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-90" />
            ) : (
              <ArrowDownToLine className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
            )}
            {dropped ? "Reset" : "Drop them"}
          </button>
        )}
      </div>

      {/* explorer body — the physics container, so chips and the detail panel
          share one world and pile up across the full width of the section */}
      <PhysicsDrop
        active={dropped}
        onDismiss={reset}
        className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12"
      >
        {/* chip cloud */}
        <motion.div
          // While the chips are physics-driven their positions are written
          // straight to `style.transform`; framer's layout projection would
          // fight it for the same property.
          layout={!reduced && !dropped}
          variants={reduced ? undefined : chipCloud}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-wrap content-start gap-2.5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((skill) => {
              const Icon = skill.icon;
              const isActive = active?.name === skill.name;
              return (
                <motion.button
                  key={skill.name}
                  layout={!reduced && !dropped}
                  variants={reduced ? undefined : chipVariants}
                  exit={reduced ? undefined : "exit"}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  {...{ [PHYSICS_BODY_ATTR]: true }}
                  // A dropped chip is something you drag, not something you
                  // pick — otherwise the panel flickers through every chip
                  // that tumbles past the cursor.
                  onMouseEnter={dropped ? undefined : () => setActive(skill)}
                  onFocus={dropped ? undefined : () => setActive(skill)}
                  onClick={dropped ? undefined : () => setActive(skill)}
                  tabIndex={dropped ? -1 : undefined}
                  aria-label={`${skill.name} — ${skill.description}`}
                  className={clsx(
                    "group inline-flex items-center gap-2 rounded-full border py-2 pl-2 pr-4 text-sm transition-colors duration-300",
                    isActive && !dropped
                      ? "bg-surface-2 text-fg"
                      : "glass text-muted hover:text-fg",
                    dropped && "select-none",
                  )}
                  style={
                    isActive && !dropped
                      ? {
                          borderColor: skill.color,
                          boxShadow: `0 0 24px -10px ${skill.color}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                    style={{
                      background: `${skill.color}1f`,
                      color: skill.color,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {skill.name}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* detail / spotlight panel — a body in its own right, so it falls with
            the chips and they pile against it */}
        <div
          {...{ [PHYSICS_BODY_ATTR]: true }}
          className={clsx(
            "relative overflow-hidden rounded-2xl glass-strong p-6 lg:sticky lg:top-28 lg:self-start",
            dropped && "select-none",
          )}
        >
          {/* faint background icon */}
          <DetailIcon className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-[0.04]" />

          {/* Content is deliberately frozen while dropped: swapping copy inside
              a tumbling, fixed-size box only reads as a glitch. */}
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.name}
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider"
                  style={{
                    background: `${active.color}1f`,
                    color: active.color,
                  }}
                >
                  {active.category}
                </span>
                <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-fg">
                  {active.name}
                </h3>
                <p className="mt-3 leading-relaxed text-muted text-pretty">
                  {active.description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={reduced ? undefined : { opacity: 0 }}
                animate={reduced ? undefined : { opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-subtle">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Explore
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold text-fg">
                  Hover a skill
                </h3>
                <p className="mt-3 leading-relaxed text-muted text-pretty">
                  {ALL_SKILLS.length} technologies across {skills.length}{" "}
                  categories. Filter by category and hover any chip to see how I
                  use it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhysicsDrop>
    </section>
  );
}
