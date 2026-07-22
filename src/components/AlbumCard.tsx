"use client";

import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { Album } from "@/lib/albums";
import type { GalleryImage } from "@/lib/images";
import { useFinePointer } from "@/lib/useFinePointer";

const MAX_TILT = 7; // degrees — restraint is the whole point
const TILT_SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

// Map pointer offset [-0.5, 0.5] → tilt degrees. rotateY tilts with the
// cursor; rotateX is inverted so pushing the cursor down lifts the card's
// top edge toward the viewer (the natural "looking at a card" feel).
function useTiltPos(v: MotionValue<number>, max: number) {
  return useTransform(v, [-0.5, 0.5], [-max, max]);
}
function useTiltNeg(v: MotionValue<number>, max: number) {
  return useTransform(v, [-0.5, 0.5], [max, -max]);
}

export default function AlbumCard({
  album,
  cover,
}: {
  album: Album;
  cover: GalleryImage | null;
}) {
  const tilt = useFinePointer();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);

  const rotateX = useSpring(useTiltNeg(py, MAX_TILT), TILT_SPRING);
  const rotateY = useSpring(useTiltPos(px, MAX_TILT), TILT_SPRING);
  const sheen = useMotionTemplate`radial-gradient(320px circle at ${sheenX}% ${sheenY}%, rgba(255,222,95,0.18), transparent 60%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
    sheenX.set(nx * 100);
    sheenY.set(ny * 100);
  }

  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div style={{ perspective: 900 }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div
        whileHover="hover"
        initial="rest"
        animate="rest"
        style={
          tilt ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined
        }
      >
        <Link
          href={`/photos/${album.slug}`}
          className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-temple-surface transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/40"
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

            {tilt && (
              <motion.div
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: sheen }}
              />
            )}

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
    </div>
  );
}
