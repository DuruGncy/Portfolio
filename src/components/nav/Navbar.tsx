"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu } from "lucide-react";
import { NAV_LINKS, NAV_SCROLL_OFFSET } from "@/lib/sections";
import { useUIStore } from "@/store/ui-store";
import { useSectionObserver } from "@/hooks/useSectionObserver";
import { useSmoothScroll } from "@/components/smooth-scroll";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { clsx } from "@/lib/clsx";

export function Navbar() {
  const activeSection = useUIStore((s) => s.activeSection);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const booted = useUIStore((s) => s.booted);
  const reduced = useUIStore((s) => s.reducedMotion);
  const { scrollTo, stop, start } = useSmoothScroll();

  // Every nav target is a section of the home page. Off that route (the 404),
  // there is nothing to scroll to, so the links have to navigate instead.
  const pathname = usePathname();
  const onHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Active-section detection (re-scans when links change).
  useSectionObserver(NAV_LINKS.length);

  // Glass background once the page has scrolled a little.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    if (menuOpen) stop();
    else start();
    return () => start();
  }, [menuOpen, stop, start]);

  // Scroll-progress indicator.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  /** Anchor href — real navigation off-home so middle/right-click still work. */
  function hrefFor(id: string) {
    if (onHome) return `#${id}`;
    return id === "home" ? "/" : `/#${id}`;
  }

  function navigate(id: string) {
    if (!onHome) {
      window.location.href = hrefFor(id);
      return;
    }
    setActiveSection(id); // optimistic highlight
    if (id === "home") scrollTo(0);
    else scrollTo(`#${id}`, { offset: NAV_SCROLL_OFFSET });
    if (typeof history !== "undefined") {
      const url = id === "home" ? window.location.pathname : `#${id}`;
      history.replaceState(null, "", url);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
    // Return focus to the toggle for keyboard users.
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <motion.header
        initial={reduced ? false : { y: -20, opacity: 0 }}
        animate={
          reduced || booted ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }
        }
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.15 }}
        className={clsx(
          "fixed inset-x-0 top-0 z-50",
          scrolled ? "py-2.5" : "py-4"
        )}
      >
        <nav
          aria-label="Primary"
          className="section-pad mx-auto flex max-w-[96rem] items-center justify-between"
        >
          {/* Brand → Home */}
          <a
            href={hrefFor("home")}
            aria-label="Duru Gencay — back to top"
            onClick={(e) => {
              e.preventDefault();
              navigate("home");
            }}
            className="group relative flex h-11 items-center font-display text-base font-semibold tracking-tight text-muted transition hover:-translate-y-0.5 hover:text-fg"
          >
            <span>DURU</span>
          </a>

          {/* Desktop links + animated indicator */}
          <div
            className={clsx(
              "hidden items-center gap-0.5 rounded-full p-1 transition-colors duration-300 lg:flex",
              scrolled && "glass-strong"
            )}
          >
            {NAV_LINKS.map((l) => {
              const active = activeSection === l.id;
              return (
                <a
                  key={l.id}
                  href={hrefFor(l.id)}
                  aria-current={active ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(l.id);
                  }}
                  className={clsx(
                    "group relative rounded-full px-3.5 py-2 text-sm transition-colors duration-300",
                    active ? "text-fg" : "text-subtle hover:text-fg"
                  )}
                >
                  {/* sliding active pill */}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 -z-10 rounded-full bg-surface-2 shadow-[0_0_20px_-6px_rgba(34,211,238,0.6)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {/* premium hover glow (non-active) */}
                  <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-surface-2/0 transition-colors duration-300 group-hover:bg-surface-2/60" />
                  <span className="relative">
                    {l.label}
                    <span className="absolute -bottom-0.5 left-1/2 h-px w-4/5 -translate-x-1/2 scale-x-0 bg-[var(--aurora)] transition-transform duration-300 group-hover:scale-x-100" />
                  </span>
                </a>
              );
            })}
          </div>

          {/* Theme toggle (all breakpoints) + mobile menu toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-full glass-strong text-fg transition-transform hover:-translate-y-0.5 active:scale-95 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>

        {/* Scroll progress bar */}
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="mx-auto mt-2 hidden h-px max-w-[96rem] origin-left bg-[var(--aurora)] opacity-70 lg:block"
        />
      </motion.header>

      <MobileMenu
        open={menuOpen}
        links={NAV_LINKS}
        hrefFor={hrefFor}
        activeSection={activeSection}
        onClose={closeMenu}
        onNavigate={(id) => {
          // Scrolling is locked while the menu is open, and a stopped Lenis
          // silently drops `scrollTo` — so release the lock *before* the jump.
          // The unlock effect that follows `closeMenu` is then a no-op instead
          // of resetting the scroll we just started.
          start();
          navigate(id);
          closeMenu();
        }}
      />
    </>
  );
}
