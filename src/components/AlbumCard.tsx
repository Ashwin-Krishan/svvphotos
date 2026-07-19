"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Album } from "@/lib/albums";
import type { GalleryImage } from "@/lib/images";

export default function AlbumCard({
  album,
  cover,
}: {
  album: Album;
  cover: GalleryImage | null;
}) {
  return (
    <motion.div whileHover="hover" initial="rest" animate="rest">
      <Link
        href={`/photos/${album.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-temple-surface"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {cover ? (
            <motion.div
              variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-temple-maroon to-temple-maroon-dark" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-temple-gold backdrop-blur-sm">
                {album.event}
              </span>
              {album.year != null && (
                <span className="font-display text-lg font-semibold text-temple-gold-dark">
                  {album.year}
                </span>
              )}
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold text-white">
              {album.title}
            </h3>
            <motion.span
              variants={{
                rest: { opacity: 0, y: 6 },
                hover: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25 }}
              className="mt-1 inline-block text-sm font-medium text-temple-gold"
            >
              View album →
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
