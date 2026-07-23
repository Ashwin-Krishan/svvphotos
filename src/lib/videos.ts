// Videos are a small, manually-curated list, not synced automatically
// like photos — each one is a one-off upload to R2 (see README.md's
// "Hero video" section for the compression recipe). Add a new entry
// here once its .mp4 + poster are uploaded to _site-assets/videos/.
//
// Order matters: this array is newest-first. videos[0] is the one that
// autoplays in the /videos page hero — when adding a new video, put it
// at the top of this list.

const R2_BASE = process.env.R2_PUBLIC_BASE_URL;

export type Video = {
  slug: string;
  title: string;
  videoUrl: string;
  posterUrl: string;
};

export const videos: Video[] = [
  {
    slug: "kappal-boat-festival-2026",
    title: "Boat Festival 2026",
    videoUrl: `${R2_BASE}/_site-assets/videos/kappal-boat-festival-2026.mp4`,
    posterUrl: `${R2_BASE}/_site-assets/videos/kappal-boat-festival-2026-poster.jpg`,
  },
  {
    slug: "varaluxumi-2025",
    title: "Varaluxumi 2025",
    videoUrl: `${R2_BASE}/_site-assets/videos/varaluxumi-2025.mp4`,
    posterUrl: `${R2_BASE}/_site-assets/videos/varaluxumi-2025-poster.jpg`,
  },
];
