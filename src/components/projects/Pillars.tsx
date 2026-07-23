"use client";

import { motion } from "framer-motion";
import { FileCode2, Recycle, Grid3x3, Brain } from "lucide-react";
import type { EngineeringPillar } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

const ICONS: Record<EngineeringPillar["icon"], React.ComponentType<{ className?: string }>> = {
  scriptable: FileCode2,
  pool: Recycle,
  procedural: Grid3x3,
  ai: Brain,
};

export function Pillars({
  pillars,
  compact = false,
}: {
  pillars: EngineeringPillar[];
  compact?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="grid grid-cols-2 gap-3">
      {pillars.map((p, i) => {
        const Icon = ICONS[p.icon];
        return (
          <motion.div
            key={p.title}
            initial={reduced ? undefined : { opacity: 0, y: 14 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
            className="group rounded-xl border border-violet/25 bg-surface p-4 transition-colors hover:border-violet/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 text-violet">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold text-fg">
              {p.title}
            </p>
            {!compact && (
              <p className={clsx("mt-1.5 text-xs leading-relaxed text-muted")}>
                {p.detail}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
