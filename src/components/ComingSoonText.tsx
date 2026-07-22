"use client";

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

export default function ComingSoonText() {
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
        Videos, <span className="italic text-shine">coming soon.</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-xl text-base text-foreground/70 sm:text-lg"
      >
        We&rsquo;re putting together video coverage of temple festivals and
        events, the same way we already do for photos. Check back soon.
      </motion.p>
    </motion.div>
  );
}
