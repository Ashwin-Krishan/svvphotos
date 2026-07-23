"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Video } from "@/lib/videos";

export default function VideoGallery({ videos }: { videos: Video[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const active = videos.find((v) => v.slug === openSlug) ?? null;

  useEffect(() => {
    if (!openSlug) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenSlug(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSlug]);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {videos.map((video) => (
          <button
            key={video.slug}
            type="button"
            onClick={() => setOpenSlug(video.slug)}
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-temple-surface text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-temple-gold"
          >
            <Image
              src={video.posterUrl}
              alt={video.title}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-temple-gold/90 text-temple-maroon-dark shadow-lg transition-transform duration-300 group-hover:scale-110">
                <PlayIcon />
              </span>
            </span>

            <span className="absolute inset-x-0 bottom-0 p-4">
              <span className="font-display text-lg font-semibold text-white">
                {video.title}
              </span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpenSlug(null)}
          >
            <button
              type="button"
              onClick={() => setOpenSlug(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <CloseIcon />
            </button>

            <motion.div
              key={active.slug}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                key={active.slug}
                src={active.videoUrl}
                poster={active.posterUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-full rounded-md"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
