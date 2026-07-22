"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useFinePointer } from "@/lib/useFinePointer";

/**
 * Wraps a button/link so it drifts a little toward the cursor while
 * hovered, then springs back when the pointer leaves — a subtle bit of
 * "aliveness" on the primary calls to action. Falls back to a plain
 * inline wrapper (no motion) on touch / reduced-motion. `strength` is the
 * fraction of the cursor offset the element follows; kept low on purpose.
 */
export default function MagneticButton({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const enabled = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  if (!enabled) {
    return <span className={className ? `inline-block ${className}` : "inline-block"}>{children}</span>;
  }

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className ? `inline-block ${className}` : "inline-block"}
    >
      {children}
    </motion.span>
  );
}
