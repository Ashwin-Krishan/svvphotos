"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useFinePointer } from "@/lib/useFinePointer";

/**
 * A soft, warm gold spotlight that trails the cursor across the dark
 * canvas — like ambient diya light following you. Spring-smoothed so it
 * lags a touch behind the pointer (that lag is what reads as "premium"
 * rather than a hard attached dot). Uses plus-lighter blending so it
 * only ever brightens what's beneath it, never darkens. Desktop +
 * motion-allowed only, and never intercepts pointer events.
 */
export default function CursorGlow() {
  const enabled = useFinePointer();
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const springX = useSpring(x, { stiffness: 220, damping: 32, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 32, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{ mixBlendMode: "plus-lighter" }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: springX,
          top: springY,
          background:
            "radial-gradient(circle, rgba(255,222,95,0.10) 0%, rgba(231,37,87,0.05) 35%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}
