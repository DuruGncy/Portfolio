"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, ArrowUp, Copy, Check, ArrowUpRight } from "lucide-react";
import { profile } from "@/content/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { SocialIcon } from "@/components/hero/BrandIcons";

/** A contact detail with an optional copy-to-clipboard action. */
function Field({
  icon: Icon,
  label,
  value,
  sub,
  href,
  copy,
  delay,
  reduced,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  copy?: string;
  delay: number;
  reduced: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the value is still visible to select */
    }
  };

  const Inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
          {label}
        </span>
        <span className="block truncate font-display text-base font-semibold text-fg">
          {value}
        </span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
    </>
  );

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex items-center gap-4 rounded-2xl glass p-4 transition-colors hover:border-border-strong"
    >
      {href ? (
        <a href={href} className="flex min-w-0 flex-1 items-center gap-4">
          {Inner}
        </a>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-4">{Inner}</div>
      )}

      {copy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-[color,background-color,transform] hover:bg-surface-2 hover:text-fg active:scale-90"
        >
          {/* The confirmation is the point of this control — scale the icon in
              rather than hard-swapping Copy → Check. Crossfaded (absolute) so
              neither icon shifts the button box. */}
          <AnimatePresence initial={false}>
            <motion.span
              key={copied ? "check" : "copy"}
              className="absolute inset-0 flex items-center justify-center"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {copied ? (
                <Check className="h-4 w-4 text-teal" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      )}
    </motion.div>
  );
}

export function Contact() {
  const reduced = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const socials = profile.socials.filter((s) => s.icon !== "mail");

  return (
    <section
      id="contact"
      data-section="contact"
      aria-labelledby="contact-title"
      className="section-pad relative mx-auto max-w-5xl scroll-mt-24 py-28 md:py-36"
    >
      {/* ---- closing statement ---- */}
      <div className="mx-auto max-w-3xl text-center">
        <motion.span
          initial={reduced ? undefined : { opacity: 0, y: 10 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
          </span>
          Available from June 2026
        </motion.span>

        <motion.h2
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          id="contact-title"
          className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight text-balance sm:text-6xl md:text-7xl"
        >
          Let&apos;s build something{" "}
          <span className="aurora-text">together</span>.
        </motion.h2>

        <motion.p
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-xl text-pretty text-muted"
        >
          Backend & cloud engineer, graduating June 2026 and ready to relocate in
          Europe. If you&apos;re hiring — or just want to talk systems — my inbox
          is open.
        </motion.p>

        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-8 flex justify-center"
        >
          <a
            href={`mailto:${profile.email}`}
            className="group inline-flex items-center gap-2.5 rounded-full aurora-border px-7 py-3.5 font-medium text-fg transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <Mail className="h-5 w-5" />
            Get in touch
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>
      </div>

      {/* ---- contact details ---- */}
      <div className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-3">
        <Field
          icon={Mail}
          label="Email"
          value={profile.email}
          href={`mailto:${profile.email}`}
          copy={profile.email}
          delay={0}
          reduced={reduced}
        />
        <Field
          icon={Phone}
          label="Phone"
          value={profile.phone}
          href={`tel:${profile.phone.replace(/\s/g, "")}`}
          copy={profile.phone}
          delay={0.08}
          reduced={reduced}
        />
        <Field
          icon={MapPin}
          label="Location"
          value="Izmir, Türkiye"
          sub="Open to relocating in Europe"
          delay={0.16}
          reduced={reduced}
        />
      </div>

      {/* ---- socials ---- */}
      <div className="mx-auto mt-8 flex max-w-3xl justify-center gap-3">
        {socials.map((s, i) => (
          // Wrapper owns the scroll-in transform so the anchor's CSS hover
          // translate stays independent; mirrors the contact-field reveal so
          // the whole block resolves as one gesture rather than the fields
          // staggering in above a row that's already there.
          <motion.div
            key={s.label}
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.label} — ${s.handle}`}
              className="flex h-12 w-12 items-center justify-center rounded-full glass text-muted transition-[transform,color] hover:-translate-y-0.5 hover:text-fg active:scale-95"
            >
              <SocialIcon icon={s.icon} className="h-5 w-5" />
            </a>
          </motion.div>
        ))}
      </div>

      {/* ---- footer ---- */}
      <footer className="mt-20 flex flex-col items-center gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs text-subtle">
          © 2026 Duru Gencay
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          Built from Izmir, headed for Europe
        </p>
        <button
          type="button"
          onClick={() => scrollTo(0)}
          className="group inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          Back to top
          <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
        </button>
      </footer>
    </section>
  );
}
