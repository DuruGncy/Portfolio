"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "lucide-react";
import type { NavLink } from "@/lib/sections";
import { clsx } from "@/lib/clsx";

interface MobileMenuProps {
  open: boolean;
  links: NavLink[];
  activeSection: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

const panel: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.06, delayChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.2, staggerChildren: 0.03, staggerDirection: -1 } },
};
const line: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { opacity: 0, y: 12 },
};

export function MobileMenu({
  open,
  links,
  activeSection,
  onClose,
  onNavigate,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape to close + focus trap while open.
  useEffect(() => {
    if (!open) return;

    // Move focus into the menu.
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          variants={panel}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[60] flex flex-col glass-strong lg:hidden"
        >
          <div className="section-pad flex items-center justify-between py-5">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Navigation
            </span>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full glass text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="section-pad flex flex-1 flex-col justify-center gap-1">
            {links.map((l, i) => {
              const active = activeSection === l.id;
              return (
                <motion.a
                  key={l.id}
                  variants={line}
                  href={`#${l.id}`}
                  aria-current={active ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(l.id);
                  }}
                  className={clsx(
                    "group flex items-baseline gap-4 py-3 font-display text-3xl font-semibold transition-colors sm:text-4xl",
                    active ? "text-fg" : "text-subtle hover:text-fg"
                  )}
                >
                  <span className="font-mono text-xs text-accent opacity-60">
                    0{i + 1}
                  </span>
                  <span className="relative">
                    {l.label}
                    <span
                      className={clsx(
                        "absolute -bottom-1 left-0 h-px w-full origin-left bg-[var(--aurora)] transition-transform duration-300",
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </span>
                </motion.a>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
