"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryImage } from "@/lib/images";

/**
 * Full-bleed crossfading slideshow of real synced photos, used as a
 * hero backdrop. Each slide gets a slow Ken Burns zoom; a dark gradient
 * sits on top so headline text stays legible. Purely decorative —
 * receives already-fetched photos, no data fetching of its own.
 */
export default function PhotoBackdrop({ photos }: { photos: GalleryImage[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 5500);
    return () => clearInterval(id);
  }, [photos.length]);

  if (photos.length === 0) return null;
  const photo = photos[index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.6, ease: "easeInOut" },
            scale: { duration: 6.5, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            className="object-cover"
            unoptimized
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      <div className="kolam-grid absolute inset-0 opacity-40" />
    </div>
  );
}
