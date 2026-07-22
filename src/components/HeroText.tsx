"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, type Variants } from "framer-motion";
import { useFinePointer } from "@/lib/useFinePointer";
import MagneticButton from "./MagneticButton";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

export default function HeroText({ firstAlbumSlug }: { firstAlbumSlug: string }) {
  const parallax = useFinePointer();

  // Whole-headline parallax: the content drifts a few px opposite the
  // cursor, giving the hero a subtle sense of depth against the video.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (!parallax) return;
    const move = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      x.set(nx * -22);
      y.set(ny * -14);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [parallax, x, y]);

  return (
    <motion.div
      style={parallax ? { x: sx, y: sy } : undefined}
      className="relative z-10 mx-auto max-w-3xl"
    >
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.p
          variants={item}
          className="font-display text-sm uppercase tracking-[0.35em] text-temple-gold"
        >
          Sri Varasiththi Vinaayagar Hindu Temple
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl"
        >
          Every festival,
          <br />
          <span className="italic text-shine">beautifully</span> kept.
        </motion.h1>

        <motion.div variants={item} className="mt-10">
          <MagneticButton>
            <Link
              href={`/photos/${firstAlbumSlug}`}
              className="inline-block rounded-full bg-temple-crimson px-7 py-3.5 font-medium text-white transition-colors hover:bg-temple-crimson/90"
            >
              Browse Photos
            </Link>
          </MagneticButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
