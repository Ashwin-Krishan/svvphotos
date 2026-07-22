"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A hair-thin gold bar across the very top that fills with scroll depth —
 * a quiet sense of "where am I" on long album pages. Spring-smoothed so
 * it glides rather than tracking the scrollbar 1:1. transform-origin-left
 * scaleX keeps it a single cheap GPU transform.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-temple-gold via-temple-gold to-temple-crimson"
      style={{ scaleX }}
    />
  );
}
