"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { clsx } from "@/lib/clsx";

/** Descendants carrying this attribute are the elements that fall. */
export const PHYSICS_BODY_ATTR = "data-physics-body";

interface PhysicsDropProps {
  /** When true the tagged descendants detach from flow and fall. */
  active: boolean;
  /** Vertical gravity factor for the simulation. */
  gravity?: number;
  /** Stiffness of the drag constraint — lower feels springier. */
  mouseConstraintStiffness?: number;
  /** Called when the effect can no longer be trusted (e.g. the width changed). */
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
}

// `Mouse.create` attaches these handlers to the mouse object itself, but the
// @types package doesn't declare them — and we need the references to unbind
// Matter's own scroll-hostile touch/wheel listeners.
type MatterHandler = (event: unknown) => void;
type MouseWithHandlers = Matter.Mouse & {
  mousemove: MatterHandler;
  mousedown: MatterHandler;
  mouseup: MatterHandler;
  mousewheel: MatterHandler;
};

const RETURN_MS = 700;
const RETURN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const RETURN_STAGGER_MS = 8;
const MAX_STAGGER_MS = 260;
const STEP_MS = 1000 / 60;
const DENSITY = 0.001; // Matter's default
/** Roughly one skill chip — the yardstick the density falloff is anchored to. */
const CHIP_AREA = 120 * 36;

/**
 * The body's chamfer should trace the element's own corners: a pill needs a
 * radius of half its height, a rounded card needs its much smaller one. Reading
 * it back beats guessing from the aspect ratio.
 */
function cornerRadius(el: HTMLElement, w: number, h: number): number {
  const parsed = parseFloat(getComputedStyle(el).borderTopLeftRadius);
  // `rounded-full` computes to an effectively infinite length; percentages and
  // unset values parse to NaN. Both should just clamp to the pill radius.
  const radius = Number.isFinite(parsed) ? parsed : Math.min(w, h) / 2;
  // Matter builds degenerate vertices if the chamfer reaches the half-extent.
  return Math.max(Math.min(radius, Math.min(w, h) / 2 - 1), 0);
}

/** Hard ceiling on borrowed space, in case a layout reports something absurd. */
const MAX_BORROWED_FALL = 520;

/**
 * How far below the container the pile can spill before it would reach real
 * content: the section's own bottom padding plus the next section's top
 * padding. That gap is empty by construction, so the drop can use it — and
 * measuring it keeps the effect correct across the responsive padding steps
 * instead of hard-coding a guess.
 */
function borrowableFallRoom(container: HTMLElement, containerBottom: number): number {
  const section = container.parentElement;
  if (!section) return 0;

  let room = section.getBoundingClientRect().bottom - containerBottom;
  const next = section.nextElementSibling;
  if (next) room += parseFloat(getComputedStyle(next).paddingTop) || 0;

  return Math.max(0, Math.min(room, MAX_BORROWED_FALL));
}

// Released by name rather than by restoring a saved `cssText`: React and
// framer-motion also write to these elements' inline styles, and a wholesale
// restore would silently revert whatever they set while the drop was running.
const OWNED_PROPS = [
  "position",
  "margin",
  "left",
  "top",
  "width",
  "height",
  "transform",
  "transition",
  "will-change",
  "cursor",
] as const;

interface Item {
  el: HTMLElement;
  body: Matter.Body;
  /** Resting centre, in container space — the origin all transforms are relative to. */
  x: number;
  y: number;
}

export function PhysicsDrop({
  active,
  gravity = 1.1,
  mouseConstraintStiffness = 0.15,
  onDismiss,
  className,
  children,
}: PhysicsDropProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Held in a ref so an inline callback from the parent can't tear the
  // simulation down and rebuild it on every render.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);
  // A drop that is flying back into place still owns the DOM; starting a new
  // one has to finish that first, or we'd measure mid-flight positions.
  const returnRef = useRef<{ timer: number; finalize: () => void } | null>(null);

  useEffect(() => {
    if (!active) return;

    returnRef.current?.finalize();

    const container = containerRef.current;
    if (!container) return;

    const { Bodies, Body, Composite, Engine, Mouse, MouseConstraint, Query } = Matter;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    if (width <= 0 || height <= 0) return;

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(`[${PHYSICS_BODY_ATTR}]`)
    );
    if (elements.length === 0) return;

    // Measure every element up front: the first `position: absolute` reflows the
    // flow layout out from under the reads that would follow it.
    const measured = elements.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        w: rect.width,
        h: rect.height,
        radius: cornerRadius(el, rect.width, rect.height),
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    });

    // Grow the play area down into the dead space under the section, then take
    // the same amount back as negative margin so nothing below actually moves.
    // The box is genuinely taller, so it still hit-tests and receives the
    // pointer events that dragging a fallen chip depends on.
    const borrowed = borrowableFallRoom(container, containerRect.bottom);
    const worldHeight = height + borrowed;

    container.style.height = `${worldHeight}px`;
    container.style.marginBottom = `-${borrowed}px`;
    container.style.overflow = "hidden";
    // The next section is `position: relative` and comes later in the DOM, so
    // by default it would paint over — and swallow the clicks meant for — the
    // part of the pile hanging into its padding.
    container.style.zIndex = "20";

    const items: Item[] = measured.map(({ el, w, h, radius, x, y }) => {
      // Anchor each element at its resting spot and drive it purely with
      // `transform`, so the handoff from flow layout is pixel-identical and the
      // per-frame updates stay on the compositor.
      el.style.position = "absolute";
      el.style.margin = "0";
      el.style.left = `${x - w / 2}px`;
      el.style.top = `${y - h / 2}px`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.transform = "translate3d(0, 0, 0) rotate(0rad)";
      el.style.willChange = "transform";
      el.style.cursor = "grab";

      const body = Bodies.rectangle(x, y, w, h, {
        chamfer: radius > 0 ? { radius } : undefined,
        restitution: 0.5,
        friction: 0.3,
        frictionAir: 0.012,
        // Mass grows with area, so a full-size panel would outweigh a chip ~25x
        // and bulldoze the pile through itself. Thinning density with the
        // square root keeps it clearly the heavy object — a few chips' worth —
        // without handing the solver a mass ratio it can't resolve.
        density: DENSITY * Math.min(1, Math.sqrt(CHIP_AREA / (w * h))),
      });
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 6, y: Math.random() * 2 });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);

      return { el, body, x, y };
    });

    const engine = Engine.create();
    engine.gravity.y = gravity;
    // Bodies here span two orders of magnitude in area; the extra positional
    // passes stop the small ones squeezing through the large one under load.
    engine.positionIterations = 10;

    const wall = { isStatic: true };
    const walls = [
      Bodies.rectangle(width / 2, worldHeight + 100, width + 400, 200, wall),
      Bodies.rectangle(width / 2, -100, width + 400, 200, wall),
      Bodies.rectangle(-100, worldHeight / 2, 200, worldHeight + 400, wall),
      Bodies.rectangle(width + 100, worldHeight / 2, 200, worldHeight + 400, wall),
    ];

    const mouse = Mouse.create(container) as MouseWithHandlers;
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: mouseConstraintStiffness, render: { visible: false } },
    });

    // Matter's own wheel and touch handlers call `preventDefault` on every
    // event, which would trap the page scroll over this section. Drop them and
    // bind replacements that only swallow a gesture that starts on a chip.
    container.removeEventListener("wheel", mouse.mousewheel as EventListener);
    container.removeEventListener("touchstart", mouse.mousedown as EventListener);
    container.removeEventListener("touchmove", mouse.mousemove as EventListener);
    container.removeEventListener("touchend", mouse.mouseup as EventListener);

    // Matter reads only these two members off the event, so a shim is enough to
    // keep its handlers from cancelling the gesture behind our back.
    const shim = (event: TouchEvent) => ({
      changedTouches: event.changedTouches,
      preventDefault: () => {},
    });

    const bodies = items.map((item) => item.body);
    let dragging = false;

    const onTouchStart = (event: TouchEvent) => {
      mouse.mousedown(shim(event));
      if (Query.point(bodies, mouse.position).length > 0) {
        dragging = true;
        event.preventDefault();
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      mouse.mousemove(shim(event));
      if (dragging) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      mouse.mouseup(shim(event));
      dragging = false;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });
    container.addEventListener("touchcancel", onTouchEnd, { passive: false });

    Composite.add(engine.world, [...walls, mouseConstraint, ...bodies]);

    const detach = () => {
      container.removeEventListener("mousemove", mouse.mousemove as EventListener);
      container.removeEventListener("mousedown", mouse.mousedown as EventListener);
      container.removeEventListener("mouseup", mouse.mouseup as EventListener);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };

    const step = () => {
      // A fixed delta keeps the pile stable when the browser throttles rAF.
      Engine.update(engine, STEP_MS);
      for (const item of items) {
        const { x, y } = item.body.position;
        item.el.style.transform = `translate3d(${x - item.x}px, ${y - item.y}px, 0) rotate(${item.body.angle}rad)`;
      }
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);

    // A width change invalidates the walls and every measured position, so hand
    // control back rather than simulating against a stale layout. Height-only
    // changes are ignored: mobile browsers fire those as the URL bar hides.
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      onDismissRef.current?.();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      detach();
      Composite.clear(engine.world, false);
      Engine.clear(engine);

      const finalize = () => {
        if (returnRef.current) clearTimeout(returnRef.current.timer);
        returnRef.current = null;
        for (const item of items) {
          for (const prop of OWNED_PROPS) item.el.style.removeProperty(prop);
        }
        container.style.removeProperty("height");
        container.style.removeProperty("margin-bottom");
        container.style.removeProperty("overflow");
        container.style.removeProperty("z-index");
      };

      // Fly everything home along a straight line, then hand the elements back
      // to flow layout — they land exactly where the layout would put them, so
      // the swap is invisible.
      let settle = RETURN_MS;
      items.forEach((item, i) => {
        const delay = Math.min(i * RETURN_STAGGER_MS, MAX_STAGGER_MS);
        settle = Math.max(settle, RETURN_MS + delay);
        item.el.style.transition = `transform ${RETURN_MS}ms ${RETURN_EASE} ${delay}ms`;
        item.el.style.transform = "translate3d(0, 0, 0) rotate(0rad)";
        item.el.style.cursor = "";
      });

      returnRef.current = {
        timer: window.setTimeout(finalize, settle + 40),
        finalize,
      };
    };
  }, [active, gravity, mouseConstraintStiffness]);

  // The effect cleanup above leaves a return animation pending; if the section
  // unmounts mid-flight, drop the timer rather than firing it at detached nodes.
  useEffect(() => {
    return () => {
      if (returnRef.current) clearTimeout(returnRef.current.timer);
      returnRef.current = null;
    };
  }, []);

  return (
    // `relative` is not optional — the falling elements are positioned against
    // this box — so it lives here rather than in the caller's className.
    <div ref={containerRef} className={clsx("relative", className)}>
      {children}
    </div>
  );
}
