"use client";

import { useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { Video } from "@/lib/videos";
import VideoLightboxPlayer from "./VideoLightboxPlayer";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

/**
 * The latest video itself as the hero — not a generic ambient loop.
 * Autoplays muted (the only way any browser allows autoplay at all),
 * looping, full-bleed behind the headline. A visible unmute toggle lets
 * anyone opt into sound without leaving the page; "Watch Full Video"
 * opens the same shared lightbox player the grid below uses, for
 * anyone who wants the real seek bar / fullscreen / volume controls.
 */
export default function FeaturedVideoHero({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }

  return (
    <section className="relative flex h-[70vh] min-h-[440px] items-center justify-center overflow-hidden px-4 text-center sm:px-6">
      <div className="absolute inset-0 overflow-hidden bg-temple-surface">
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/55 to-background" />
        <div className="kolam-grid absolute inset-0 opacity-40" />
      </div>

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
          Event <span className="italic text-shine">videos.</span>
        </motion.h1>

        <motion.p variants={item} className="mt-4 text-sm uppercase tracking-[0.2em] text-foreground/60">
          Now showing — {video.title}
        </motion.p>

        <motion.div variants={item} className="mt-9 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowLightbox(true)}
            className="inline-block rounded-full bg-temple-crimson px-7 py-3.5 font-medium text-white transition-colors hover:bg-temple-crimson/90"
          >
            Watch Full Video
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            {muted ? <MutedIcon /> : <UnmutedIcon />}
          </button>
        </motion.div>
      </motion.div>

      <VideoLightboxPlayer video={showLightbox ? video : null} onClose={() => setShowLightbox(false)} />
    </section>
  );
}

function MutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
      <path d="M23 9l-6 6M17 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

function UnmutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
    </svg>
  );
}
