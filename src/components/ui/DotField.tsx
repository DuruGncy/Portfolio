"use client";

import { memo, useEffect, useId, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUIStore } from "@/store/ui-store";
import { clsx } from "@/lib/clsx";

/**
 * React Bits `DotField`, adapted for this project.
 *
 * A grid of dots painted to a single canvas path; near the cursor they bulge
 * outward, and a soft radial bloom follows the pointer. Used as the hero
 * backdrop (see `Hero.tsx`, which owns its scroll fade / parallax).
 *
 * Adaptations, all deliberate:
 *
 *  - **theme-aware colours.** The dot gradient and cursor bloom default to this
 *    site's aurora palette (teal → violet) and re-resolve when the theme flips;
 *    the `gradient*` / `glowColor` props still override per instance.
 *  - **reduced motion + touch render a static field.** No frame loop, no
 *    listeners, no bloom — just the grid, painted once. Neither case has an
 *    effect worth spending frames on (a coarse pointer has no hover at all).
 *  - **the loop parks itself.** An IntersectionObserver on the host plus a
 *    `visibilitychange` listener stop the rAF whenever the field is off-screen
 *    or the tab is hidden. Upstream runs forever; this field lives at the top
 *    of an eight-section page, so it would otherwise burn a frame budget the
 *    whole way down.
 *  - **cursor mapping is measured per move**, not cached at resize time.
 *    Upstream caches `rect.left + scrollX` once, which drifts under Lenis'
 *    smooth scroll; and because the host is transformed while the hero scrolls
 *    away, the visual rect is scaled — so the pointer is divided back into the
 *    canvas' own layout space.
 *  - **sizing reads `offsetWidth/Height`** (layout px, immune to that same
 *    transform) and is driven by a ResizeObserver rather than window `resize`,
 *    so a changing hero height — mobile URL bar, `100svh` — is picked up.
 *  - **the mouse-speed sampler folded into the frame loop.** Upstream keeps a
 *    standalone 20ms `setInterval`, which would keep ticking while parked.
 *  - **`useId` for the gradient id.** Upstream's `Math.random()` differs
 *    between the server and client renders and would fail hydration.
 *  - the bloom's outer gradient stop reuses `glowColor` at zero opacity instead
 *    of `transparent`, which some engines interpolate through black.
 *
 * Note `dotRadius` is upstream's name and upstream's meaning: dots are drawn at
 * `dotRadius / 2`, and grid spacing is `dotRadius + dotSpacing`.
 */

const TWO_PI = Math.PI * 2;

interface Dot {
  /** Anchor — where the dot rests. */
  ax: number;
  ay: number;
  /** Smoothed draw position (what's painted). */
  sx: number;
  sy: number;
  /** Velocity + integrated position, used only when `bulgeOnly` is false. */
  vx: number;
  vy: number;
  x: number;
  y: number;
}

/**
 * Aurora-matched palettes. Dark leans on the neon tokens; light uses the
 * deepened accents, at a touch more alpha since small dots wash out on white.
 */
const PALETTE = {
  dark: {
    from: "rgba(45, 212, 191, 0.34)", // --teal
    to: "rgba(167, 139, 250, 0.26)", // --violet
    glow: "rgba(34, 211, 238, 0.09)", // --cyan bloom
  },
  light: {
    from: "rgba(15, 118, 110, 0.34)",
    to: "rgba(124, 58, 237, 0.26)",
    glow: "rgba(14, 116, 144, 0.08)",
  },
} as const;

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  /** Override the theme-derived dot gradient / cursor bloom. */
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
}

/** Live prop mirror the frame loop reads, so prop tweaks need no re-mount. */
interface LiveProps {
  dotRadius: number;
  dotSpacing: number;
  cursorRadius: number;
  cursorForce: number;
  bulgeOnly: boolean;
  bulgeStrength: number;
  sparkle: boolean;
  waveAmplitude: number;
  gradientFrom: string;
  gradientTo: string;
}

const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom,
  gradientTo,
  glowColor,
  className,
}: DotFieldProps) {
  const reduced = useReducedMotion();
  const theme = useUIStore((s) => s.theme);
  const palette = PALETTE[theme];

  const from = gradientFrom ?? palette.from;
  const to = gradientTo ?? palette.to;
  const glow = glowColor ?? palette.glow;

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);

  // Mirrored on every render so the loop always paints with current props.
  // Written during render (not in an effect) because the mount effect paints
  // its first frame synchronously and would otherwise read an empty mirror.
  const propsRef = useRef<LiveProps>({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom: from,
    gradientTo: to,
  });
  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom: from,
    gradientTo: to,
  };

  // Grid geometry changes need the dots rebuilt; a static field needs a repaint.
  const rebuildRef = useRef<(() => void) | null>(null);
  const repaintRef = useRef<(() => void) | null>(null);

  // Stable, SSR-safe id for the bloom's radial gradient. Sanitised because
  // React's generated ids carry delimiters that don't belong in an attribute.
  const glowId = `dot-field-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // A coarse pointer never hovers, so there is nothing to animate toward.
    const interactive =
      !reduced && !window.matchMedia("(pointer: coarse)").matches;

    // ---------------------------------------------------------------- layout

    function measure() {
      // Layout px, so the hero's scroll transform can't feed back into the
      // backing-store size (which `getBoundingClientRect()` would).
      const w = host!.offsetWidth;
      const h = host!.offsetHeight;
      if (w < 1 || h < 1) return false;

      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      buildDots(w, h);
      return true;
    }

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots: Dot[] = new Array(rows * cols);
      let idx = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
      dotsRef.current = dots;
    }

    // ----------------------------------------------------------------- paint

    let frame = 0;

    function render() {
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const dots = dotsRef.current;
      const len = dots.length;
      const rad = p.dotRadius / 2;
      const t = frame * 0.02;

      ctx!.clearRect(0, 0, w, h);

      const grad = ctx!.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p.gradientFrom);
      grad.addColorStop(1, p.gradientTo);
      ctx!.fillStyle = grad;

      ctx!.beginPath();
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        let drawX = d.sx;
        let drawY = d.sy;

        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }

        let r = rad;
        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frame >> 3)) >>> 0;
          if (hash % 100 < 3) r = rad * 1.8;
        }

        ctx!.moveTo(drawX + r, drawY);
        ctx!.arc(drawX, drawY, r, 0, TWO_PI);
      }
      ctx!.fill();
    }

    // --------------------------------------------------------------- physics

    function step() {
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const p = propsRef.current;
      const len = dots.length;

      // Pointer speed, sampled once per frame (upstream used a 20ms interval).
      const mdx = m.prevX - m.x;
      const mdy = m.prevY - m.y;
      const travelled = Math.sqrt(mdx * mdx + mdy * mdy);
      m.speed += (travelled - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;

      const target = Math.min(m.speed / 5, 1);
      engagement.current += (target - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;
      const glowEl = glowRef.current;
      if (glowEl) {
        glowEl.setAttribute("cx", String(m.x));
        glowEl.setAttribute("cy", String(m.y));
        glowEl.style.opacity = String(glowOpacity.current);
      }

      const cr = p.cursorRadius;
      const crSq = cr * cr;
      const isBulge = p.bulgeOnly;

      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          const angle = Math.atan2(dy, dx);
          if (isBulge) {
            const falloff = 1 - dist / cr;
            const push = falloff * falloff * p.bulgeStrength * eng;
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const move = (500 / dist) * (m.speed * p.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }
      }
    }

    function tick() {
      frame++;
      step();
      render();
      rafRef.current = requestAnimationFrame(tick);
    }

    // ------------------------------------------------- run / park the loop

    let running = false;

    function play() {
      if (running) return;
      running = true;
      // Resume from rest rather than from a stale sample, which would read as
      // one huge jump of pointer travel on the first frame back.
      const m = mouseRef.current;
      m.prevX = m.x;
      m.prevY = m.y;
      m.speed = 0;
      rafRef.current = requestAnimationFrame(tick);
    }

    function park() {
      if (!running) return;
      running = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    let onScreen = true;
    let awake = document.visibilityState !== "hidden";
    const sync = () => {
      if (onScreen && awake) play();
      else park();
    };

    function onMouseMove(e: MouseEvent) {
      if (!running) return;
      const r = canvas!.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      // Divide the visual rect back into layout space: while the hero scrolls
      // away its wrapper is scaled, so `r` is larger than the canvas' own
      // coordinate system.
      const m = mouseRef.current;
      m.x = (e.clientX - r.left) * (sizeRef.current.w / r.width);
      m.y = (e.clientY - r.top) * (sizeRef.current.h / r.height);
    }

    const onVisibility = () => {
      awake = document.visibilityState !== "hidden";
      sync();
    };

    // -------------------------------------------------------------- wire up

    measure();

    const ro = new ResizeObserver(() => {
      // Fires once on observe, which covers the case where the host had no
      // size yet at mount (fonts / layout still settling).
      if (measure() && !interactive) render();
    });
    ro.observe(host);

    let io: IntersectionObserver | null = null;

    if (interactive) {
      io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        },
        { rootMargin: "10% 0px" }
      );
      io.observe(host);
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      play();
    } else {
      render();
    }

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) {
        buildDots(w, h);
        if (!interactive) render();
      }
    };
    repaintRef.current = () => {
      if (!interactive) render();
    };

    return () => {
      park();
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      rebuildRef.current = null;
      repaintRef.current = null;
    };
  }, [reduced]);

  // Geometry props change the grid itself.
  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  // A static field paints once, so a colour change (theme flip) needs a nudge.
  useEffect(() => {
    repaintRef.current?.();
  }, [from, to]);

  return (
    <div ref={hostRef} className={clsx("relative h-full w-full", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Cursor bloom. Skipped entirely when there's no cursor to follow. */}
      {!reduced && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id={glowId}>
              <stop offset="0%" stopColor={glow} />
              <stop offset="100%" stopColor={glow} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999"
            cy="-9999"
            r={glowRadius}
            fill={`url(#${glowId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          />
        </svg>
      )}
    </div>
  );
});

export default DotField;
