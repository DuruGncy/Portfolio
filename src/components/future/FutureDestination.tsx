"use client";

import { motion } from "framer-motion";
import { MapPin, GraduationCap, Compass, ArrowDown, Plane } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

// SVG canvas is 800×560; HTML markers are positioned by percentage so they
// stay pinned to the globe as it scales responsively.
const VW = 800;
const VH = 560;
const pct = (x: number, y: number) => ({
  left: `${(x / VW) * 100}%`,
  top: `${(y / VH) * 100}%`,
});

// The globe geometry — a face-on sphere centred in the canvas.
const GLOBE = { cx: 400, cy: 280, r: 200 };

// Latitude rings: horizontal ellipses flattened for perspective.
const LATS = [-150, -100, -50, 0, 50, 100, 150].map((dy) => {
  const rx = Math.sqrt(Math.max(0, GLOBE.r * GLOBE.r - dy * dy));
  return { cy: GLOBE.cy + dy, rx, ry: rx * 0.18 };
});
// Meridian rings: vertical ellipses at a few longitudes (the widest is the rim).
const MERIDIANS = [0.34, 0.68].map((k) => k * GLOBE.r);

// The three chapters of the journey, placed on the visible face of the globe.
interface Stop {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  tone: string;
  belgium?: boolean;
  future?: boolean;
}
const STOPS: Stop[] = [
  { id: "izmir", x: 520, y: 372, label: "Izmir", sub: "Türkiye · home", tone: "#38bdf8" },
  { id: "brugge", x: 322, y: 205, label: "Brugge", sub: "Belgium · Erasmus", tone: "#2dd4bf", belgium: true },
  { id: "future", x: 400, y: 238, label: "Europe", sub: "the next chapter", tone: "#a78bfa", future: true },
];

// Faint candidate cities around the "future" beacon — openness to relocation.
const CANDIDATES = [
  { x: 362, y: 212 },
  { x: 438, y: 214 },
  { x: 380, y: 262 },
  { x: 432, y: 256 },
  { x: 400, y: 192 },
];

// A curved great-circle arc bowing up from Izmir over to Brugge.
const ROUTE = "M520,372 C 470,250 384,178 322,205";

export function FutureDestination() {
  const reduced = useReducedMotion();

  return (
    <section
      id="future-destination"
      data-section="future-destination"
      aria-labelledby="future-destination-title"
      className="section-pad relative mx-auto max-w-7xl scroll-mt-24 py-28 md:py-36"
    >
      {/* masthead */}
      <div className="mb-14 flex items-center gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          07 — Future Destination
        </p>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          Izmir → Europe
        </p>
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        {/* ---------- narrative ---------- */}
        <div>
          <h2
            id="future-destination-title"
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl"
          >
            My next chapter is{" "}
            <span className="aurora-text">in Europe</span>.
          </h2>

          {/* route stepper: Izmir ↓ Brugge ↓ Future Europe */}
          <ol className="mt-9 space-y-1">
            {[
              { icon: MapPin, title: "Izmir", note: "Where it started — B.Sc. Software Engineering.", tone: "text-cyan" },
              { icon: GraduationCap, title: "Brugge, Belgium", note: "Erasmus semester abroad. The turning point.", tone: "text-teal" },
              { icon: Compass, title: "Future Europe", note: "Building a career in cloud & backend.", tone: "text-violet" },
            ].map((step, i, arr) => {
              const Icon = step.icon;
              return (
                <li key={step.title}>
                  <motion.div
                    initial={reduced ? undefined : { opacity: 0, x: -14 }}
                    whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-4"
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full glass ${step.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="pb-1">
                      <p className="font-display text-lg font-semibold text-fg">{step.title}</p>
                      <p className="text-sm text-muted">{step.note}</p>
                    </div>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <div className="ml-[18px] flex h-6 items-center">
                      <ArrowDown className="h-4 w-4 text-subtle" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Erasmus / Belgium highlight card */}
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-9 overflow-hidden rounded-2xl glass-strong p-6"
          >
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-teal" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
                Erasmus
              </span>
              <span className="text-subtle">·</span>
              <span className="text-sm text-muted">Brugge, Belgium 🇧🇪</span>
            </div>
            <p className="mt-3 leading-relaxed text-muted text-pretty">
              I spent my Erasmus semester studying{" "}
              <span className="text-fg">Applied Computer Science</span> at
              Hogeschool West-Vlaanderen in Brugge. Living and studying abroad
              didn&apos;t just sharpen my engineering — it confirmed exactly
              where I want to be. I came home certain:{" "}
              <span className="text-fg">Europe is next.</span>
            </p>
          </motion.div>

          {/* ambition chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Open to relocation in Europe", "Cloud & backend engineering", "Learning Dutch 🇳🇱"].map(
              (c) => (
                <span
                  key={c}
                  className="rounded-full border border-border-subtle bg-surface-2 px-3.5 py-1.5 font-mono text-xs text-muted"
                >
                  {c}
                </span>
              )
            )}
          </div>
        </div>

        {/* ---------- the globe ---------- */}
        <div className="relative">
          <div className="relative w-full overflow-hidden rounded-3xl glass p-4 sm:p-6">
            <div className="relative">
              <svg
                viewBox={`0 0 ${VW} ${VH}`}
                className="h-auto w-full"
                role="img"
                aria-label="A minimal globe tracing Duru's journey along a curved arc from Izmir, Türkiye to Brugge, Belgium, and onward across Europe."
              >
                <defs>
                  <radialGradient id="globeGrad" cx="38%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.12)" />
                    <stop offset="55%" stopColor="rgba(120,150,200,0.05)" />
                    <stop offset="100%" stopColor="rgba(10,14,25,0.55)" />
                  </radialGradient>
                  <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="55%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                  <radialGradient id="futureGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(167,139,250,0.35)" />
                    <stop offset="100%" stopColor="rgba(167,139,250,0)" />
                  </radialGradient>
                </defs>

                {/* sphere body */}
                <circle
                  cx={GLOBE.cx}
                  cy={GLOBE.cy}
                  r={GLOBE.r}
                  fill="url(#globeGrad)"
                  stroke="rgba(148,178,230,0.38)"
                  strokeWidth="1.5"
                />

                {/* wireframe graticule */}
                <g
                  fill="none"
                  stroke="rgba(148,178,230,0.16)"
                  strokeWidth="1"
                >
                  {LATS.map((l, i) => (
                    <ellipse key={`lat${i}`} cx={GLOBE.cx} cy={l.cy} rx={l.rx} ry={l.ry} />
                  ))}
                  {MERIDIANS.map((rx, i) => (
                    <ellipse key={`mer${i}`} cx={GLOBE.cx} cy={GLOBE.cy} rx={rx} ry={GLOBE.r} />
                  ))}
                  <line x1={GLOBE.cx} y1={GLOBE.cy - GLOBE.r} x2={GLOBE.cx} y2={GLOBE.cy + GLOBE.r} />
                </g>

                {/* future aura behind central Europe */}
                <circle cx="400" cy="238" r="120" fill="url(#futureGlow)" />

                {/* animated great-circle arc */}
                <motion.path
                  d={ROUTE}
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="1 7"
                  initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
                  whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                />

                {/* travelling comet */}
                {!reduced && (
                  <circle r="5" fill="#e8ecf6" style={{ filter: "drop-shadow(0 0 8px #22d3ee)" }}>
                    <animateMotion
                      dur="5.5s"
                      repeatCount="indefinite"
                      rotate="auto"
                      path={ROUTE}
                    />
                  </circle>
                )}
              </svg>

              {/* ---- HTML marker overlay (scales with the SVG box) ---- */}
              {/* faint candidate cities */}
              {CANDIDATES.map((c, i) => (
                <span
                  key={`cand${i}`}
                  aria-hidden
                  className={clsx(
                    "absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/60",
                    !reduced && "fd-candidate"
                  )}
                  style={{ ...pct(c.x, c.y), animationDelay: `${i * 0.4}s` }}
                />
              ))}

              {/* the three journey stops */}
              {STOPS.map((s, i) => (
                <div
                  key={s.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={pct(s.x, s.y)}
                >
                  {/* pulsing ring */}
                  {!reduced && (
                    <span
                      aria-hidden
                      className="fd-ring absolute left-1/2 top-1/2 h-4 w-4 rounded-full"
                      style={{ border: `1.5px solid ${s.tone}`, animationDelay: `${i * 0.5}s` }}
                    />
                  )}
                  {/* node */}
                  <motion.span
                    className="relative block h-3 w-3 rounded-full"
                    style={{ background: s.tone, boxShadow: `0 0 12px ${s.tone}` }}
                    initial={reduced ? undefined : { scale: 0.6, opacity: 0 }}
                    whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.5, type: "spring", stiffness: 400, damping: 18 }}
                  />
                  {/* label chip */}
                  <motion.div
                    className={`absolute left-1/2 top-full mt-2 w-max -translate-x-1/2 rounded-lg glass-strong px-2.5 py-1.5 text-center ${
                      s.belgium ? "ring-1 ring-teal/50" : ""
                    }`}
                    initial={reduced ? undefined : { opacity: 0, y: -4 }}
                    whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.5, duration: 0.4 }}
                  >
                    <span className="flex items-center gap-1 font-display text-xs font-semibold text-fg">
                      {s.future && <Plane className="h-3 w-3" style={{ color: s.tone }} />}
                      {s.label}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-subtle">
                      {s.sub}
                    </span>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-subtle">
            One journey, still being drawn
          </p>
        </div>
      </div>
    </section>
  );
}
