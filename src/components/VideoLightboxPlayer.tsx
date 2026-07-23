"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Video } from "@/lib/videos";

/**
 * The full-controls, unmuted playback experience — shared by the
 * featured hero's "Watch full video" button and the grid below, so
 * there's exactly one implementation of "here's the real player."
 */
export default function VideoLightboxPlayer({
  video,
  onClose,
}: {
  video: Video | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!video) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [video, onClose]);

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <CloseIcon />
          </button>

          <motion.div
            key={video.slug}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              key={video.slug}
              src={video.videoUrl}
              poster={video.posterUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[85vh] w-full rounded-md"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
