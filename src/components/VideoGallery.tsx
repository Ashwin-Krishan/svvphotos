"use client";

import { useState } from "react";
import Image from "next/image";
import type { Video } from "@/lib/videos";
import VideoLightboxPlayer from "./VideoLightboxPlayer";

export default function VideoGallery({ videos }: { videos: Video[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const active = videos.find((v) => v.slug === openSlug) ?? null;

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

      <VideoLightboxPlayer video={active} onClose={() => setOpenSlug(null)} />
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
