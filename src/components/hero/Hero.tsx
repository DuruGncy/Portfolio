"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useScroll,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, Download, Send } from "lucide-react";
import { profile } from "@/content/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUIStore } from "@/store/ui-store";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { NAV_SCROLL_OFFSET } from "@/lib/sections";
import { SocialIcon } from "./BrandIcons";
import { Terminal } from "./Terminal";
import { DynamicWeight } from "./DynamicWeight";

/**
 * Hero entrance — a choreographed "wake up" that plays *after* the boot screen
 * clears (gated on the shared `booted` cue), never underneath it.
 *
 * The timeline below is a set of delays, in seconds, measured from the moment
 * the overlay begins dismissing. Elements arrive in a deliberate order —
 * badge → title (masked reveal) → role → intro → CTAs → socials → terminal —
 * then the terminal wakes and starts typing. Everything moves on GPU-cheap
 * transforms (opacity / translate / scale / clip-path) so it holds 60fps and
 * shifts no layout. Under reduced motion the whole thing renders at rest.
 */
const T = {
  badge: 0.4,
  title: 0.55,
  role: 1.0,
  intro: 1.12,
  ctas: 1.28,
  socials: 1.62,
  terminal: 1.55,
  settle: 2.5, // terminal begins typing; idle shimmer arms
};

// A calm expo-out — confident deceleration, no overshoot.
const EASE = [0.22, 1, 0.36, 1] as const;

// Generic "fade up" with a per-element delay.
const fadeUp = (delay: number, y = 16): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
});

// Title: a soft masked reveal that wipes left → right (clip-path is
// compositor-driven and causes no reflow), riding in on a small lift.
// Only the right edge animates (the left→right wipe). Top / bottom / left stay
// constant and extend *past* the box — the tight `leading-[0.95]` lets the "y"
// descender spill below the line box, and weight-morphing widens glyphs, so the
// resting clip is padded on those sides to never touch a letter.
const titleReveal: Variants = {
  hidden: { opacity: 0, y: 10, clipPath: "inset(-0.15em 100% -0.35em 0)" },
  show: {
    opacity: 1,
    y: 0,
    clipPath: "inset(-0.15em -4% -0.35em 0)",
    transition: {
      delay: T.title,
      clipPath: { duration: 1.0, ease: EASE },
      y: { duration: 1.0, ease: EASE },
      opacity: { duration: 0.5, ease: "linear" },
    },
  },
};

// CTA group + item: a tight spring stagger so the buttons "settle" into place.
const ctaGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: T.ctas, staggerChildren: 0.09 } },
};
const ctaItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 26 },
  },
};

// Socials group + item: fade-and-lift, one by one.
const socialGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: T.socials, staggerChildren: 0.07 } },
};
const socialItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// Terminal: fades in while scaling 98% → 100%.
const terminalReveal: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: EASE, delay: T.terminal },
  },
};

/**
 * Magnetic — the wrapped element drifts a few pixels toward the cursor and
 * springs back on leave. Restrained (Stripe-style), capped at 10px.
 */
function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cap = 10;
    const mx = (e.clientX - (r.left + r.width / 2)) * strength;
    const my = (e.clientY - (r.top + r.height / 2)) * strength;
    x.set(Math.max(-cap, Math.min(cap, mx)));
    y.set(Math.max(-cap, Math.min(cap, my)));
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={reduced ? undefined : { x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const booted = useUIStore((s) => s.booted);
  const { scrollTo } = useSmoothScroll();
  const sectionRef = useRef<HTMLElement>(null);

  const go = (id: string) => scrollTo(`#${id}`, { offset: NAV_SCROLL_OFFSET });

  // Reveal state: reduced motion snaps straight to rest; otherwise we hold at
  // "hidden" until the boot cue lands, then run the timeline.
  const reveal = reduced || booted ? "show" : "hidden";

  // The terminal stays quiet (no typing, no cursor) until the entrance has
  // essentially finished — the last beat of the sequence.
  const [terminalLive, setTerminalLive] = useState(false);
  useEffect(() => {
    if (!booted) return;
    if (reduced) {
      setTerminalLive(true);
      return;
    }
    const id = window.setTimeout(() => setTerminalLive(true), T.settle * 1000);
    return () => window.clearTimeout(id);
  }, [booted, reduced]);

  // --- subtle mouse depth (a few px, springed) — foreground vs. terminal ---
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const depthX = useSpring(dx, { stiffness: 120, damping: 20, mass: 0.5 });
  const depthY = useSpring(dy, { stiffness: 120, damping: 20, mass: 0.5 });
  const contentX = useTransform(depthX, (v) => v * 6);
  const contentMouseY = useTransform(depthY, (v) => v * 6);
  const termX = useTransform(depthX, (v) => v * -8);
  const termMouseY = useTransform(depthY, (v) => v * -8);

  // --- scroll: as the hero leaves, content recedes with a touch of depth so
  // the next section reads as gliding over it (restrained, not a big parallax).
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentLift = useTransform(scrollYProgress, [0, 0.6], [0, -70]);
  const termLift = useTransform(scrollYProgress, [0, 0.6], [0, -28]);
  const heroFade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const cueShift = useTransform(scrollYProgress, [0, 0.28], [0, 14]);

  // Compose mouse depth + scroll lift into a single Y per column.
  const contentY = useTransform(
    [contentMouseY, contentLift],
    ([m, s]: number[]) => m + s
  );
  const termY = useTransform(
    [termMouseY, termLift],
    ([m, s]: number[]) => m + s
  );

  // --- name gradient tracks the cursor horizontally, with a slow idle shimmer ---
  const namePos = useMotionValue(50);
  const namePosS = useSpring(namePos, { stiffness: 120, damping: 20 });
  const nameBg = useMotionTemplate`${namePosS}% 50%`;
  const nameHovered = useRef(false);

  const onSectionMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    dx.set((e.clientX - (r.left + r.width / 2)) / r.width);
    dy.set((e.clientY - (r.top + r.height / 2)) / r.height);
  };
  const onSectionLeave = () => {
    dx.set(0);
    dy.set(0);
  };
  const onNameMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    namePos.set(((e.clientX - r.left) / r.width) * 100);
  };

  // Idle shimmer: once settled, sweep the gradient across the letters every
  // ~17s — but never while the cursor is actively steering it.
  useEffect(() => {
    if (!terminalLive || reduced) return;
    const id = window.setInterval(() => {
      if (nameHovered.current) return;
      animate(namePos, [50, 14, 86, 50], { duration: 2.6, ease: "easeInOut" });
    }, 17000);
    return () => window.clearInterval(id);
  }, [terminalLive, reduced, namePos]);

  const depthStyle = (x: typeof contentX, y: typeof contentY) =>
    reduced ? undefined : { x, y, opacity: heroFade };

  return (
    <section
      id="home"
      ref={sectionRef}
      data-section="home"
      aria-labelledby="hero-title"
      onMouseMove={onSectionMove}
      onMouseLeave={onSectionLeave}
      className="section-pad relative mx-auto flex min-h-[100svh] max-w-[96rem] items-center py-28 lg:py-24"
    >
      <motion.div
        initial={reduced ? false : "hidden"}
        animate={reveal}
        className="grid w-full items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24"
      >
        {/* LEFT — depth wrapper forwards the entrance state to its children */}
        <motion.div style={depthStyle(contentX, contentY)}>
          {/* status badge — the single, purposeful statement of intent */}
          <motion.p
            variants={reduced ? undefined : fadeUp(T.badge)}
            className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 font-mono text-xs text-muted"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
            </span>
            Available for opportunities in Europe
          </motion.p>

          {/* name — the loudest element on the page; reveals with a masked
              left→right wipe, then each letter morphs weight toward the cursor */}
          <motion.h1
            id="hero-title"
            variants={reduced ? undefined : titleReveal}
            onMouseMove={onNameMove}
            onMouseEnter={() => (nameHovered.current = true)}
            onMouseLeave={() => (nameHovered.current = false)}
            className="mt-9 font-display text-[clamp(3rem,7.5vw,6rem)] leading-[0.95] tracking-tight text-balance"
          >
            <DynamicWeight text="Duru " />
            <motion.span
              className="name-gradient"
              style={reduced ? undefined : { backgroundPosition: nameBg }}
            >
              <DynamicWeight text="Gencay" />
            </motion.span>
          </motion.h1>

          {/* role — one quiet line, no decorative label */}
          <motion.p
            variants={reduced ? undefined : fadeUp(T.role, 12)}
            className="mt-5 font-display text-xl font-medium text-muted sm:text-2xl"
          >
            Software Engineer
          </motion.p>

          {/* intro — kept to ~three airy lines */}
          <motion.p
            variants={reduced ? undefined : fadeUp(T.intro, 12)}
            className="mt-7 max-w-lg text-base leading-[1.75] text-muted text-pretty sm:text-lg"
          >
            {profile.heroIntro}
          </motion.p>

          {/* primary actions — spring in with a subtle stagger */}
          <motion.div
            variants={reduced ? undefined : ctaGroup}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <motion.div variants={reduced ? undefined : ctaItem}>
              <Magnetic>
                <button
                  onClick={() => go("mission-archive")}
                  className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-[#05060b] transition-transform duration-300 will-change-transform hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  View Projects
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </Magnetic>
            </motion.div>

            <motion.a
              variants={reduced ? undefined : ctaItem}
              href="/Duru_Gencay_Resume.pdf"
              download
              className="group inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-3 text-sm font-medium text-fg transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2 active:scale-[0.97]"
            >
              <Download className="h-4 w-4 text-teal transition-transform duration-300 group-hover:-translate-y-0.5" />
              Resume
            </motion.a>

            <motion.button
              variants={reduced ? undefined : ctaItem}
              onClick={() => go("contact")}
              className="group inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-3 text-sm font-medium text-fg transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2 active:scale-[0.97]"
            >
              <Send className="h-4 w-4 text-violet transition-transform duration-300 group-hover:translate-x-0.5" />
              Get in Touch
            </motion.button>
          </motion.div>

          {/* socials — four refined "reach me" buttons, revealed one by one */}
          <motion.div
            variants={reduced ? undefined : socialGroup}
            className="mt-10 flex flex-wrap items-center gap-2.5"
          >
            {profile.socials.map((s) => (
              <motion.div key={s.label} variants={reduced ? undefined : socialItem}>
                <Magnetic strength={0.25}>
                  <a
                    href={s.href}
                    target={s.icon === "mail" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="group inline-flex items-center gap-2 rounded-full border border-border-subtle glass px-4 py-2.5 text-sm font-medium text-muted transition-[transform,border-color,color] duration-300 hover:-translate-y-0.5 hover:border-teal/40 hover:text-fg active:scale-[0.97]"
                  >
                    <SocialIcon
                      icon={s.icon}
                      className="h-[17px] w-[17px] text-subtle transition-colors duration-300 group-hover:text-teal"
                    />
                    {s.label}
                  </a>
                </Magnetic>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — terminal: narrower, taller, floated into its own space */}
        <motion.div style={depthStyle(termX, termY)} className="w-full">
          <motion.div
            variants={reduced ? undefined : terminalReveal}
            className="mx-auto w-full max-w-[580px] lg:ml-auto lg:mr-0"
          >
            <Terminal start={terminalLive} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* scroll cue — appears once the sequence settles; transforms as you scroll */}
      <motion.div
        aria-hidden
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? { opacity: 1 } : booted ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : T.settle }}
        className="pointer-events-none absolute inset-x-0 bottom-7 hidden flex-col items-center gap-2 sm:flex"
      >
        <motion.div
          style={reduced ? undefined : { opacity: cueOpacity, y: cueShift }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">
            Scroll
          </span>
          <span className="scroll-cue" />
        </motion.div>
      </motion.div>
    </section>
  );
}
