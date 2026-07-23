"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { books } from "@/content/books";
import type { Book } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ── Organic lean: deterministic trig mix (from the reference shelf) ── */
function getLean(idx: number) {
  const raw = Math.sin(idx * 2.4 + 0.8) * 2.6 + Math.cos(idx * 1.1 + 0.3) * 1.4;
  // Round to 2dp: the browser's CSSOM rounds high-precision angles when it
  // parses the server HTML, so an unrounded value would never match the
  // client render and would trip a hydration warning. Rounding here keeps the
  // serialized transform byte-identical on both sides (and immune to any
  // Math.sin drift between the Node and browser engines).
  return Math.round(raw * 100) / 100;
}

/* ── Break a title into at most two balanced, upper-cased lines ─────── */
function titleLines(title: string): string[] {
  const t = title.toUpperCase();
  if (t.length <= 13) return [t];
  const words = t.split(" ");
  if (words.length === 1) return [t];
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    if (Math.abs(a - b) < bestDiff) {
      bestDiff = Math.abs(a - b);
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/* ── Per-book cover motif ────────────────────────────────────────────
   Each book id maps to an original, thematic line-drawing (no copyrighted
   cover art). All coordinates are centred on (cx, cy) and every stroke uses
   the book's own `accent` colour, so a motif automatically suits any palette.
   To retheme a book, edit its case; to add a real cover instead, set
   `coverImage` on the book (see Book type) and this is skipped entirely. */
function motif(id: number, cx: number, cy: number, A: string): string {
  // Small helpers shared by several motifs.
  const ring = (r: number, op: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${A}" opacity="${op}"/>`;
  const rays = (oy: number, r0: number, r1: number, n = 12) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i * (360 / n) * Math.PI) / 180;
      return `<line x1="${cx + Math.cos(a) * r0}" y1="${cy + oy + Math.sin(a) * r0}"
        x2="${cx + Math.cos(a) * r1}" y2="${cy + oy + Math.sin(a) * r1}"
        stroke="${A}" stroke-width="0.8" opacity="0.4"/>`;
    }).join("");
  const crescent = (ox: number, oy: number, r: number, op: number) =>
    `<path d="M ${cx + ox} ${cy + oy - r} A ${r} ${r} 0 1 0 ${cx + ox} ${cy + oy + r}
      A ${r * 0.78} ${r * 0.78} 0 1 1 ${cx + ox} ${cy + oy - r} Z"
      fill="${A}" opacity="${op}"/>`;
  const star = (x: number, y: number, s: number) =>
    `<path d="M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y}
      L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28}
      L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z" fill="${A}" opacity="0.5"/>`;

  switch (id) {
    /* Dark Matter — nested boxes + branching realities */
    case 1:
      return `
        ${[0, 1, 2]
          .map((k) => {
            const s = 42 - k * 12;
            return `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="2"
              fill="none" stroke="${A}" stroke-width="0.9" opacity="${0.55 - k * 0.13}"
              transform="rotate(${k * 18} ${cx} ${cy})"/>`;
          })
          .join("")}
        ${[-42, -15, 15, 42]
          .map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            const x = cx + Math.cos(a) * 50;
            const y = cy + Math.sin(a) * 50;
            return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${A}" stroke-width="0.7" opacity="0.28"/>
              <circle cx="${x}" cy="${y}" r="2.2" fill="${A}" opacity="0.5"/>`;
          })
          .join("")}
        ${ring(2.6, 0.6)}`;

    /* The Alchemist — desert sun, dunes, pyramid, guiding star */
    case 2:
      return `
        <circle cx="${cx}" cy="${cy - 14}" r="14" fill="${A}" opacity="0.16"/>
        ${rays(-14, 17, 23)}
        <path d="M ${cx - 20} ${cy + 34} L ${cx} ${cy + 6} L ${cx + 20} ${cy + 34} Z"
          fill="${A}" opacity="0.12" stroke="${A}" stroke-width="0.9"/>
        <line x1="${cx - 8} " y1="${cy + 22}" x2="${cx + 4}" y2="${cy + 22}" stroke="${A}" stroke-width="0.6" opacity="0.3"/>
        <path d="M ${cx - 36} ${cy + 42} Q ${cx - 14} ${cy + 31} ${cx + 8} ${cy + 42}"
          fill="none" stroke="${A}" stroke-width="0.9" opacity="0.3"/>
        <path d="M ${cx - 4} ${cy + 48} Q ${cx + 18} ${cy + 37} ${cx + 38} ${cy + 48}"
          fill="none" stroke="${A}" stroke-width="0.9" opacity="0.3"/>
        ${star(cx + 24, cy - 22, 4)}`;

    /* Circe — crescent moon, herb sprig, scattered stars */
    case 3:
      return `
        ${crescent(-4, -6, 17, 0.2)}
        <line x1="${cx}" y1="${cy + 8}" x2="${cx}" y2="${cy + 44}" stroke="${A}" stroke-width="1" opacity="0.3"/>
        ${[0, 1, 2, 3]
          .map((k) => {
            const y = cy + 16 + k * 8;
            const s = 10 - k;
            return `<path d="M ${cx} ${y} Q ${cx + s} ${y - 4} ${cx + s + 4} ${y - 10}" fill="none" stroke="${A}" stroke-width="0.7" opacity="0.32"/>
              <path d="M ${cx} ${y + 3} Q ${cx - s} ${y - 1} ${cx - s - 4} ${y - 7}" fill="none" stroke="${A}" stroke-width="0.7" opacity="0.32"/>`;
          })
          .join("")}
        ${star(cx + 26, cy - 20, 3.5)}${star(cx - 24, cy + 2, 2.8)}${star(cx + 20, cy + 30, 2.5)}`;

    /* A Game of Thrones — a crown */
    case 4:
      return `
        <path d="M ${cx - 26} ${cy + 18} L ${cx - 26} ${cy - 6} L ${cx - 13} ${cy + 6}
          L ${cx} ${cy - 16} L ${cx + 13} ${cy + 6} L ${cx + 26} ${cy - 6} L ${cx + 26} ${cy + 18} Z"
          fill="${A}" opacity="0.14" stroke="${A}" stroke-width="1"/>
        <rect x="${cx - 26}" y="${cy + 18}" width="52" height="6" fill="${A}" opacity="0.22"/>
        <circle cx="${cx}" cy="${cy - 16}" r="2.4" fill="${A}" opacity="0.6"/>
        <circle cx="${cx - 26}" cy="${cy - 6}" r="2" fill="${A}" opacity="0.5"/>
        <circle cx="${cx + 26}" cy="${cy - 6}" r="2" fill="${A}" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy + 21}" r="2" fill="${A}" opacity="0.5"/>`;

    /* Dune — twin suns over rolling desert dunes */
    case 5:
      return `
        <circle cx="${cx - 6}" cy="${cy - 30}" r="9" fill="${A}" opacity="0.2"/>
        <circle cx="${cx + 18}" cy="${cy - 24}" r="5" fill="${A}" opacity="0.14"/>
        ${[0, 1, 2, 3]
          .map((k) => {
            const y = cy - 4 + k * 12;
            const dir = k % 2 === 0 ? 1 : -1;
            return `<path d="M ${cx - 40} ${y} Q ${cx} ${y - 14 * dir} ${cx + 40} ${y}"
              fill="none" stroke="${A}" stroke-width="1" opacity="${0.34 - k * 0.05}"/>`;
          })
          .join("")}`;

    /* Sophie's World — a question mark framed by classical columns */
    case 6:
      return `
        <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="58" font-weight="700"
          fill="${A}" opacity="0.22" font-family="Georgia, serif">?</text>
        ${[-30, 30]
          .map(
            (ox) => `
          <rect x="${cx + ox - 4}" y="${cy - 6}" width="8" height="34" fill="none" stroke="${A}" stroke-width="0.7" opacity="0.3"/>
          <rect x="${cx + ox - 7}" y="${cy - 10}" width="14" height="4" fill="${A}" opacity="0.22"/>
          <rect x="${cx + ox - 7}" y="${cy + 28}" width="14" height="4" fill="${A}" opacity="0.22"/>`,
          )
          .join("")}`;

    /* Origin — a spiral galaxy of drifting nodes */
    case 7:
      return `
        ${ring(3, 0.5)}
        ${Array.from({ length: 40 }, (_, d) => {
          const a = (d * 137.508 * Math.PI) / 180;
          const r = Math.sqrt(d + 1) * 5;
          if (r > 40) return "";
          const s = 1.6 - r / 40;
          return `<circle cx="${cx + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}"
            r="${Math.max(0.7, s)}" fill="${A}" opacity="${0.5 - r / 110}"/>`;
        }).join("")}`;

    /* My Year of Rest and Relaxation — moon, sleep Z's, a pill capsule */
    case 8:
      return `
        ${crescent(-10, -8, 16, 0.2)}
        ${[
          [cx + 6, cy - 14, 13],
          [cx + 18, cy - 2, 10],
          [cx + 27, cy + 8, 7],
        ]
          .map(
            ([x, y, s]) =>
              `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" font-weight="700"
                fill="${A}" opacity="0.42" font-family="Georgia, serif">Z</text>`,
          )
          .join("")}
        <g transform="rotate(35 ${cx} ${cy + 30})">
          <rect x="${cx - 14}" y="${cy + 24}" width="28" height="12" rx="6"
            fill="none" stroke="${A}" stroke-width="1" opacity="0.4"/>
          <rect x="${cx - 14}" y="${cy + 24}" width="14" height="12" rx="6" fill="${A}" opacity="0.16"/>
        </g>`;

    default:
      return ring(10, 0.2) + rays(0, 12, 20);
  }
}

/* ── Full cover: ground + author kicker + themed motif + title. ─────── */
function coverSVG(b: Book): string {
  const W = b.coverW;
  const H = b.h;
  const A = b.accent; // line-art + lettering
  const cx = W / 2;
  const cy = H * 0.4;

  const lines = titleLines(b.title);
  const titleSize = lines.some((l) => l.length > 11) ? 7 : 8.5;
  const titleY = H - 20 - (lines.length - 1) * 12;
  const titleText = lines
    .map(
      (l, i) =>
        `<text x="${cx}" y="${titleY + i * 12}" text-anchor="middle"
          font-size="${titleSize}" font-weight="700" fill="${A}"
          letter-spacing="1.4" font-family="Georgia, serif" opacity="0.6">${l}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
    preserveAspectRatio="xMidYMid slice">
    <rect width="${W}" height="${H}" fill="${b.c0}"/>
    <text x="${cx}" y="20" text-anchor="middle" font-size="6.5" font-weight="600"
      fill="${A}" letter-spacing="2" font-family="Georgia, serif" opacity="0.42">
      ${b.author.toUpperCase().slice(0, 22)}</text>
    ${motif(b.id, cx, cy, A)}
    <line x1="18" y1="${H - 52}" x2="${W - 18}" y2="${H - 52}" stroke="${A}" stroke-width="0.5" opacity="0.18"/>
    ${titleText}
  </svg>`;
}

export function Books() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<{ idx: number; dir: number }>({
    idx: -1,
    dir: 1,
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const arrowLeftRef = useRef<HTMLButtonElement>(null);
  const arrowRightRef = useRef<HTMLButtonElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Lerp-scroll state lives in refs so the rAF loop never triggers re-renders.
  const targetX = useRef(0);
  const currentX = useRef(0);
  const rafId = useRef(0);
  const reducedRef = useRef(reduced);
  const loopRef = useRef<() => void>(() => {});

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const getMaxScroll = useCallback(() => {
    const row = rowRef.current;
    const vp = viewportRef.current;
    if (!row || !vp) return 0;
    return Math.max(0, row.scrollWidth - vp.clientWidth);
  }, []);

  const updateArrows = useCallback(() => {
    arrowLeftRef.current?.classList.toggle("visible", currentX.current > 2);
    arrowRightRef.current?.classList.toggle(
      "visible",
      currentX.current < getMaxScroll() - 2,
    );
  }, [getMaxScroll]);

  // The rAF step lives in a ref so it can recurse without a self-referencing
  // callback; it only ever touches refs, so a stable identity is fine.
  useEffect(() => {
    const apply = () => {
      if (rowRef.current)
        rowRef.current.style.transform = `translateX(${-currentX.current}px)`;
    };
    loopRef.current = function step() {
      const diff = targetX.current - currentX.current;
      if (Math.abs(diff) < 0.3) {
        currentX.current = targetX.current;
        apply();
        updateArrows();
        return;
      }
      currentX.current += diff * 0.13;
      apply();
      updateArrows();
      rafId.current = requestAnimationFrame(loopRef.current);
    };
  }, [updateArrows]);

  const scrollTo = useCallback(
    (x: number) => {
      targetX.current = Math.max(0, Math.min(getMaxScroll(), x));
      if (reducedRef.current) {
        currentX.current = targetX.current;
        if (rowRef.current)
          rowRef.current.style.transform = `translateX(${-currentX.current}px)`;
        updateArrows();
        return;
      }
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(loopRef.current);
    },
    [getMaxScroll, updateArrows],
  );

  /* Wheel / drag / touch scrolling, wired imperatively on mount. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollTo(targetX.current + e.deltaY * 0.8);
    };

    let dragActive = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    const onDown = (e: MouseEvent) => {
      dragActive = true;
      dragStartX = e.clientX;
      dragStartScroll = targetX.current;
      vp.style.cursor = "grabbing";
    };
    const onMove = (e: MouseEvent) => {
      if (!dragActive) return;
      scrollTo(dragStartScroll - (e.clientX - dragStartX));
    };
    const onUp = () => {
      dragActive = false;
      vp.style.cursor = "";
    };

    let touchStartX = 0;
    let touchStartScroll = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartScroll = targetX.current;
    };
    const onTouchMove = (e: TouchEvent) => {
      scrollTo(touchStartScroll - (e.touches[0].clientX - touchStartX));
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    vp.addEventListener("touchstart", onTouchStart, { passive: true });
    vp.addEventListener("touchmove", onTouchMove, { passive: true });

    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    updateArrows();

    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId.current);
    };
  }, [scrollTo, updateArrows]);

  /* When a book opens, keep it in view — but only scroll if the widened book
     actually overflows, and only by the overflow. Re-centring on every click
     yanked the whole row sideways while the width was still animating; scrolling
     the minimum (usually nothing) lets the neighbours simply glide aside. */
  useEffect(() => {
    if (active.idx === -1) {
      updateArrows();
      return;
    }
    const wrap = wrapRefs.current[active.idx];
    const vp = viewportRef.current;
    if (!wrap || !vp) return;
    const raf = requestAnimationFrame(() => {
      const book = books[active.idx];
      const openW = book.spineW + book.coverW;
      // wrap.offsetLeft depends only on *preceding* books, so it's stable while
      // this book's own width animates — safe to measure immediately.
      const bookLeft = wrap.offsetLeft - currentX.current;
      const pad = 24;
      let delta = 0;
      if (openW >= vp.clientWidth - pad * 2) {
        // Wider than the viewport — centre it.
        delta = bookLeft - (vp.clientWidth - openW) / 2;
      } else if (bookLeft + openW > vp.clientWidth - pad) {
        // Cover spills off the right — reveal just the overflow.
        delta = bookLeft + openW - (vp.clientWidth - pad);
      } else if (bookLeft < pad) {
        // Spine sits under the left edge — nudge it back in.
        delta = bookLeft - pad;
      }
      if (Math.abs(delta) > 1) scrollTo(currentX.current + delta);
    });
    return () => cancelAnimationFrame(raf);
  }, [active.idx, scrollTo, updateArrows]);

  const handleClick = (idx: number) => {
    setActive((cur) => {
      if (cur.idx === idx) return { idx: -1, dir: cur.dir };
      return { idx, dir: cur.idx === -1 || idx > cur.idx ? 1 : -1 };
    });
  };

  /* Esc closes; arrows step through open books or nudge the shelf. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive((cur) => ({ idx: -1, dir: cur.dir }));
      } else if (e.key === "ArrowRight") {
        setActive((cur) => {
          if (cur.idx === -1) {
            scrollTo(targetX.current + 160);
            return cur;
          }
          const n = Math.min(cur.idx + 1, books.length - 1);
          return n === cur.idx ? cur : { idx: n, dir: 1 };
        });
      } else if (e.key === "ArrowLeft") {
        setActive((cur) => {
          if (cur.idx === -1) {
            scrollTo(targetX.current - 160);
            return cur;
          }
          return cur.idx > 0 ? { idx: cur.idx - 1, dir: -1 } : cur;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollTo]);

  const selected = active.idx === -1 ? null : books[active.idx];

  return (
    <section
      id="books"
      data-section="books"
      aria-labelledby="books-title"
      className="section-pad relative mx-auto max-w-7xl scroll-mt-24 py-28 md:py-36"
    >
      {/* site masthead — keeps the numbered-section rhythm */}
      <div className="mb-4 flex items-center gap-4">
        <h2
          id="books-title"
          className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
        >
          <span aria-hidden="true">06 — </span>Books
        </h2>
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="hidden font-mono text-xs uppercase tracking-[0.3em] text-subtle sm:block">
          The bookshelf
        </p>
      </div>
      <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted">
        The stories that shaped how I think — about systems, journeys and the
        questions worth asking. Pull one off the shelf.
      </p>

      {/* ---- warm shelf panel ---- */}
      <div className="bs-section" data-reduced={reduced ? "true" : "false"}>
        <div className="bs-heading">
          <h3>Books I love</h3>
          <span className="bs-sublabel">Tap a spine</span>
        </div>

        <div className="bs-shelf-outer">
          <button
            type="button"
            ref={arrowLeftRef}
            className="bs-arrow bs-arrow-left"
            aria-label="Scroll left"
            onClick={() => scrollTo(targetX.current - 160)}
          >
            &#x2039;
          </button>
          <button
            type="button"
            ref={arrowRightRef}
            className="bs-arrow bs-arrow-right"
            aria-label="Scroll right"
            onClick={() => scrollTo(targetX.current + 160)}
          >
            &#x203a;
          </button>

          <div className="bs-viewport" ref={viewportRef}>
            <div className="bs-books-row" ref={rowRef}>
              {books.map((b, i) => {
                const isOpen = i === active.idx;
                const lean = reduced ? 0 : getLean(i);
                return (
                  <div
                    key={b.id}
                    ref={(el) => {
                      wrapRefs.current[i] = el;
                    }}
                    className={`bs-book-wrap${isOpen ? " open" : ""}`}
                    // Hinge transforms are set inline (not via .open CSS): the
                    // site runs Tailwind v4 cascade layers, which reorder the
                    // .open descendant rules below the base .bs-* rules so they
                    // never win. Inline styles bypass layers entirely.
                    style={{ transform: `rotateZ(${isOpen ? 0 : lean}deg)` }}
                  >
                    <button
                      type="button"
                      className={`bs-book-btn${isOpen ? " open" : ""}`}
                      style={{
                        width: isOpen ? b.spineW + b.coverW : b.spineW,
                        perspective: 1000,
                      }}
                      aria-label={
                        isOpen ? `Close ${b.title}` : `Open ${b.title}`
                      }
                      aria-expanded={isOpen}
                      onClick={() => handleClick(i)}
                    >
                      <div
                        className="bs-spine"
                        // The generated SVG/HTML string carries newlines and
                        // indentation between attributes that the browser
                        // collapses when it parses the SSR markup; that
                        // normalization is unavoidable and cosmetic, so we tell
                        // React to accept the DOM rather than warn on it.
                        suppressHydrationWarning
                        style={{
                          background: b.spine,
                          color: b.spineText,
                          width: b.spineW,
                          height: b.h,
                          transform: isOpen ? "rotateY(-60deg)" : "rotateY(0deg)",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: b.spineImage
                            ? `<img src="${b.spineImage}" alt=""><span class="bs-paper-tex"></span>`
                            : `<span class="bs-paper-tex"></span><span class="bs-spine-title" style="max-height:${b.h - 24}px">${b.title}</span>`,
                        }}
                      />
                      <div
                        className="bs-cover"
                        // Same as the spine: the cover SVG string is normalized
                        // by the browser on parse, an unavoidable cosmetic diff.
                        suppressHydrationWarning
                        style={{
                          width: b.coverW,
                          height: b.h,
                          transform: isOpen ? "rotateY(30deg)" : "rotateY(88.8deg)",
                          visibility: isOpen ? "visible" : "hidden",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `${
                            b.coverImage
                              ? `<img src="${b.coverImage}" alt="${b.title}">`
                              : coverSVG(b)
                          }<span class="bs-paper-tex"></span><span class="bs-binding"></span>`,
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bs-plank" />

        {/* nav dots */}
        <div className="bs-dots">
          {books.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={`bs-dot${i === active.idx ? " active" : ""}`}
              aria-label={`Show ${b.title}`}
              onClick={() => handleClick(i)}
            />
          ))}
        </div>

        {/* review — slides in beside the shelf */}
        <div className="bs-review" aria-live="polite">
          <div
            className="bs-review-empty"
            style={{ opacity: selected ? 0 : 1, transition: "opacity 0.4s" }}
          >
            Click a spine to know more
          </div>
          <AnimatePresence mode="wait" custom={active.dir}>
            {selected && (
              <motion.div
                key={selected.id}
                className="bs-card"
                custom={active.dir}
                initial={
                  reduced ? false : { opacity: 0, x: active.dir > 0 ? 20 : -20 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, x: active.dir > 0 ? -20 : 20 }
                }
                transition={{ duration: reduced ? 0 : 0.38, ease: "easeInOut" }}
              >
                <div className="bs-card-title">{selected.title}</div>
                <div className="bs-card-byline">
                  {selected.author}
                  <span className="bs-stars" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, s) => (
                      <span
                        key={s}
                        className={`bs-star ${s < selected.rating ? "on" : "off"}`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                </div>
                <p className="bs-card-thoughts">&ldquo;{selected.thoughts}&rdquo;</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
