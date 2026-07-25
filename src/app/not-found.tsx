"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Home } from "lucide-react";
import TiltedCard from "@/components/ui/TiltedCard";
import { NAV_LINKS } from "@/lib/sections";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// A few useful places to land instead of the dead end. "home" is already the
// primary CTA, so it's dropped from the secondary row.
const SHORTCUTS = NAV_LINKS.filter((l) =>
  ["mission-archive", "journey", "skills", "contact"].includes(l.id)
);

/**
 * Root 404. Under `output: "export"` this is emitted as `404.html`, which the
 * static host serves for any unmatched path — so it's the only fallback the
 * site has. It renders inside the root layout, meaning the ambient background,
 * navbar and floating assistant are all still there.
 */
export default function NotFound() {
  const reduced = useReducedMotion();

  return (
    <main
      id="main"
      className="section-pad relative mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center py-28 text-center"
    >
      <motion.p
        initial={reduced ? undefined : { opacity: 0, y: 10 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
      >
        Error 404 — route not found
      </motion.p>

      {/* The cat is decorative; the message below carries the meaning. It ships
          its own SMIL animation (tail flick, paw swipe), which browsers run
          inside an <img> — no client JS involved. */}
      <motion.div
        initial={reduced ? undefined : { opacity: 0, scale: 0.94 }}
        animate={reduced ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-8 w-full max-w-[26rem]"
      >
        {/* Aurora bloom so the illustration's pale backdrop reads as a lit
            spotlight rather than a sticker pasted onto the deep-space page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-[var(--aurora)] opacity-25 blur-3xl"
        />
        <div className="aspect-[950/847] w-full">
          <TiltedCard
            containerWidth="100%"
            containerHeight="100%"
            imageWidth="100%"
            imageHeight="100%"
            rotateAmplitude={12}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
          >
            <Image
              src="/pink-cat.svg"
              alt=""
              aria-hidden
              width={950}
              height={847}
              priority
              className="h-full w-full object-contain [transform:translateZ(0)]"
            />
          </TiltedCard>
        </div>
      </motion.div>

      <motion.h1
        initial={reduced ? undefined : { opacity: 0, y: 16 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl"
      >
        This page went <span className="aurora-text">off-route</span>.
      </motion.h1>

      <motion.p
        initial={reduced ? undefined : { opacity: 0, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.22 }}
        className="mx-auto mt-5 max-w-md text-pretty text-muted"
      >
        Nothing is deployed at this path — and the cat isn&apos;t saying what
        happened to it. Everything worth seeing lives back on the main page.
      </motion.p>

      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.28 }}
        className="mt-8 flex justify-center"
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-full aurora-border px-7 py-3.5 font-medium text-fg transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <Home className="h-5 w-5" />
          Back to home
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </motion.div>

      <nav
        aria-label="Popular sections"
        className="mt-12 flex flex-wrap items-center justify-center gap-2"
      >
        {SHORTCUTS.map((l, i) => (
          <motion.div
            key={l.id}
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 + i * 0.06 }}
          >
            <Link
              href={`/#${l.id}`}
              className="inline-flex rounded-full glass px-4 py-2 font-mono text-xs text-muted transition-[transform,color] hover:-translate-y-0.5 hover:text-fg"
            >
              {l.label}
            </Link>
          </motion.div>
        ))}
      </nav>
    </main>
  );
}
