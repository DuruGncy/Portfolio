"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

/**
 * React Bits `TiltedCard`, adapted for this project:
 *
 * - imports from `framer-motion` (already a dependency) rather than `motion/react`;
 * - `children` may replace the built-in `<img>` so callers can pass a
 *   `next/image` (or any node) and keep image optimisation;
 * - the tilt is disabled under the site-wide reduced-motion preference;
 * - the mouse velocity used for the caption tilt lives in a ref instead of
 *   state, so pointer moves don't re-render the tree;
 * - the tooltip uses theme tokens so it works in light and dark mode.
 */
interface TiltedCardProps {
  imageSrc?: React.ComponentProps<"img">["src"];
  altText?: string;
  captionText?: string;
  containerHeight?: React.CSSProperties["height"];
  containerWidth?: React.CSSProperties["width"];
  imageHeight?: React.CSSProperties["height"];
  imageWidth?: React.CSSProperties["width"];
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  /** Custom media in place of `imageSrc` (e.g. a `next/image`). */
  children?: React.ReactNode;
  className?: string;
}

const springValues: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  children,
  className,
}: TiltedCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });

  const lastY = useRef(0);

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (!ref.current || reduced) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY.current;
    rotateFigcaption.set(-velocityY * 0.6);
    lastY.current = offsetY;
  }

  function handleMouseEnter() {
    if (reduced) return;
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  return (
    <figure
      ref={ref}
      className={clsx(
        "relative flex h-full w-full flex-col items-center justify-center [perspective:800px]",
        className
      )}
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="absolute top-4 block text-center text-sm sm:hidden">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      )}

      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
        }}
      >
        {children ??
          (imageSrc ? (
            <motion.img
              src={imageSrc}
              alt={altText}
              className="absolute left-0 top-0 rounded-[15px] object-cover will-change-transform [transform:translateZ(0)]"
              style={{
                width: imageWidth,
                height: imageHeight,
              }}
            />
          ) : null)}

        {displayOverlayContent && overlayContent && (
          <motion.div className="absolute left-0 top-0 z-[2] h-full w-full will-change-transform [transform:translateZ(30px)]">
            {overlayContent}
          </motion.div>
        )}
      </motion.div>

      {showTooltip && captionText && (
        <motion.figcaption
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[3] hidden rounded-[4px] border border-border-subtle bg-surface px-[10px] py-[4px] font-mono text-[10px] text-fg opacity-0 shadow-lg sm:block"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
