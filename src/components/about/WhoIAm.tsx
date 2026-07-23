"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { GraduationCap, Landmark, Building2, Crosshair } from "lucide-react";
import { profile } from "@/content/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

interface PhotoProps {
  tag: string;
  title: string;
  caption: string;
  place: string;
  coord: string;
  year: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  className: string;
  rotate: number;
  y?: MotionValue<number>;
  delay: number;
}

/**
 * A "field-note" plate. Not a missing photo — a designed cartographic card that
 * pins each chapter of the journey to a place, coordinate and year.
 */
function Photo({
  tag,
  title,
  caption,
  place,
  coord,
  year,
  icon: Icon,
  gradient,
  className,
  rotate,
  y,
  delay,
}: PhotoProps) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      style={{ y, rotate }}
      initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
      whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={clsx(
        "absolute overflow-hidden rounded-xl border border-white/10 bg-surface p-1.5 shadow-[0_40px_70px_-30px_rgba(0,0,0,0.85)] backdrop-blur",
        className
      )}
    >
      <div
        className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg"
        style={{ background: gradient }}
      >
        {/* emblem — icon set in a designed ring */}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20">
          <span
            aria-hidden
            className="absolute inset-0 scale-[1.35] rounded-full border border-white/10"
          />
          <Icon className="h-7 w-7 text-white/70" />
        </span>

        {/* coordinate — reads as a map fix, not a missing asset */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 font-mono text-[8px] tracking-wider text-white/65">
          <Crosshair className="h-2.5 w-2.5" />
          {coord}
        </span>

        {/* place + year strip */}
        <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-2 pt-7 font-mono text-[9px] uppercase tracking-wider">
          <span className="text-white/85">{place}</span>
          <span className="text-white/55 tabular-nums">{year}</span>
        </div>

        {/* vignette */}
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_50%,rgba(0,0,0,0.45))]" />
      </div>
      <figcaption className="flex items-baseline gap-2 px-1.5 pb-1 pt-2">
        <span className="font-mono text-[10px] text-accent">{tag}</span>
        <span className="truncate font-mono text-[10px] text-muted">
          <span className="text-fg/80">{title}</span> — {caption}
        </span>
      </figcaption>
    </motion.figure>
  );
}

export function WhoIAm() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Different rates → depth as the cluster drifts on scroll.
  const yA = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yB = useTransform(scrollYProgress, [0, 1], [80, -60]);
  const yC = useTransform(scrollYProgress, [0, 1], [-15, 45]);

  const paras = profile.aboutParagraphs;

  return (
    <section
      ref={sectionRef}
      id="who-i-am"
      data-section="who-i-am"
      aria-labelledby="who-i-am-title"
      className="section-pad relative mx-auto max-w-7xl scroll-mt-24 overflow-hidden py-28 md:py-36"
    >
      {/* oversized editorial index */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 right-2 select-none font-display text-[28vw] font-bold leading-none text-white/[0.02] md:text-[16rem]"
      >
        02
      </span>

      {/* masthead */}
      <motion.div
        variants={reduced ? undefined : reveal}
        initial={reduced ? undefined : "hidden"}
        whileInView={reduced ? undefined : "show"}
        viewport={{ once: true, amount: 0.6 }}
        className="relative mb-14 flex items-center gap-4"
      >
        <h2
          id="who-i-am-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">02 — </span>Who I Am
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          Izmir → Europe
        </p>
      </motion.div>

      <div className="relative grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        {/* ---------- photo composition ---------- */}
        <div className="relative">
          <div className="relative mx-auto aspect-[5/6] w-full max-w-[30rem]">
            <Photo
              tag="01"
              title="Graduation"
              caption="Yaşar University"
              place="Izmir, TR"
              coord="38.44°N 27.14°E"
              year="2026"
              icon={GraduationCap}
              gradient="linear-gradient(150deg,#6d28d9,#312e81 60%,#0b1020)"
              className="left-0 top-[2%] z-20 w-[60%]"
              rotate={-3}
              y={reduced ? undefined : yA}
              delay={0}
            />
            <Photo
              tag="02"
              title="Erasmus"
              caption="Brugge, Belgium 🇧🇪"
              place="Brugge, BE"
              coord="51.21°N 3.22°E"
              year="2025"
              icon={Landmark}
              gradient="linear-gradient(150deg,#0e7490,#0f766e 55%,#08131a)"
              className="right-0 top-[27%] z-30 w-[54%]"
              rotate={4}
              y={reduced ? undefined : yB}
              delay={0.1}
            />
            <Photo
              tag="03"
              title="Internship"
              caption="Arkas · Bimar IT"
              place="Izmir, TR"
              coord="38.44°N 27.14°E"
              year="2024"
              icon={Building2}
              gradient="linear-gradient(150deg,#334155,#1e293b 55%,#0a0f1a)"
              className="bottom-0 left-[12%] z-10 w-[46%]"
              rotate={-6}
              y={reduced ? undefined : yC}
              delay={0.2}
            />
          </div>

          {/* rotated margin note */}
          <span
            aria-hidden
            className="absolute -left-2 bottom-8 hidden origin-left -rotate-90 font-mono text-[10px] uppercase tracking-[0.4em] text-subtle xl:block"
          >
            Field notes
          </span>
        </div>

        {/* ---------- editorial body ---------- */}
        <motion.div
          variants={reduced ? undefined : { show: { transition: { staggerChildren: 0.08 } } }}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "show"}
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-2xl"
        >
          {/* lead with drop cap */}
          <motion.p
            variants={reduced ? undefined : reveal}
            className="text-lg leading-relaxed text-fg text-pretty first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.7] first-letter:text-teal sm:text-xl"
          >
            {paras[0]}
          </motion.p>

          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-5 leading-relaxed text-muted text-pretty"
          >
            {paras[1]}
          </motion.p>

          {/* pull quote — engineering focus */}
          <motion.blockquote
            variants={reduced ? undefined : reveal}
            className="my-8 border-l-2 border-[var(--teal)] pl-5"
          >
            <p className="font-display text-2xl font-medium leading-snug text-balance sm:text-[1.75rem]">
              <span className="aurora-text">{paras[2]}</span>
            </p>
          </motion.blockquote>

          <motion.p
            variants={reduced ? undefined : reveal}
            className="leading-relaxed text-muted text-pretty"
          >
            {paras[3]}
          </motion.p>

          {/* languages line as an editorial caption */}
          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-6 border-t border-border-subtle pt-5 font-mono text-sm text-subtle"
          >
            {paras[4]}
          </motion.p>

          {/* closing statement + signature */}
          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-6 font-display text-xl font-medium text-fg text-balance sm:text-2xl"
          >
            {paras[5]}
          </motion.p>
          <motion.p
            variants={reduced ? undefined : reveal}
            className="mt-4 font-display text-3xl italic text-muted"
            style={{ fontFamily: "var(--font-display)" }}
          >
            — Duru
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
