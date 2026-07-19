"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

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
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 mx-auto max-w-3xl"
    >
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
        <Link
          href={`/photos/${firstAlbumSlug}`}
          className="inline-block rounded-full bg-temple-crimson px-7 py-3.5 font-medium text-white transition-transform hover:scale-105 hover:bg-temple-crimson/90"
        >
          Browse Photos
        </Link>
      </motion.div>
    </motion.div>
  );
}
