"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Zap, Cpu, Database, ChevronDown } from "lucide-react";
import type { ArchitectureNode } from "@/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EventBridge: CalendarClock,
  Lambda: Zap,
  "Data Processing": Cpu,
  DynamoDB: Database,
};

const STEP = 0.7; // seconds a packet spends per connector

export function ArchitectureFlow({
  nodes,
  compact = false,
}: {
  nodes: ArchitectureNode[];
  compact?: boolean;
}) {
  const reduced = useReducedMotion();
  const connectors = nodes.length - 1;
  const cycle = STEP + (connectors - 1) * STEP; // full chain travel time

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col">
      {nodes.map((node, i) => {
        const Icon = ICONS[node.label] ?? Cpu;
        return (
          <Fragment key={node.label}>
            <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-cyan/25 bg-surface px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-sm text-fg">{node.label}</p>
                {!compact && (
                  <p className="truncate text-xs text-muted">{node.detail}</p>
                )}
              </div>
              {/* arrival glow pulse */}
              {!reduced && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{ boxShadow: "inset 0 0 20px 0 rgba(34,211,238,0.35)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.9, 0] }}
                  transition={{
                    duration: STEP,
                    times: [0, 0.4, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: cycle - STEP,
                    delay: i * STEP,
                  }}
                />
              )}
            </div>

            {i < connectors && (
              <div className="relative mx-auto h-9 w-8">
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-cyan/50 to-cyan/20" />
                <ChevronDown className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-cyan/40" />
                {/* traveling data packet */}
                {!reduced && (
                  <motion.span
                    aria-hidden
                    // The connector box is h-9 (36px); the packet travels from
                    // -4px to just past the bottom (40px) on the compositor via
                    // `y` (transform) rather than animating `top` (layout).
                    // `x: "-50%"` keeps it centred since Framer owns `transform`.
                    className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(34,211,238,0.8)]"
                    initial={{ x: "-50%", y: -4, opacity: 0 }}
                    animate={{
                      x: "-50%",
                      y: [-4, 40],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: STEP,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: cycle - STEP,
                      delay: i * STEP,
                    }}
                  />
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
