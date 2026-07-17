import { getAlbum } from "./albums";
import { isR2Configured, listAlbumObjectKeys, publicUrlForKey } from "./r2";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

// Deterministic pseudo-dimensions for local placeholder mode, matching the
// aspect ratios baked into scripts/generate-placeholders.mjs.
const PLACEHOLDER_SHAPES = [
  { width: 1200, height: 900 },
  { width: 1200, height: 1500 },
  { width: 1200, height: 1200 },
];

function localPlaceholderImages(slug: string, count: number): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const shape = PLACEHOLDER_SHAPES[i % PLACEHOLDER_SHAPES.length];
    return {
      id: `${slug}-${n}`,
      src: `/placeholders/${slug}/photo-${n}.svg`,
      alt: `${slug.replace(/-/g, " ")} photo ${n}`,
      width: shape.width,
      height: shape.height,
    };
  });
}

/**
 * Returns the photos for a given album/event slug.
 *
 * Today (pre-Phase-2 / no R2 credentials yet) this reads generated
 * placeholder SVGs from /public/placeholders. Once Cloudflare R2 is
 * approved and R2_* env vars are set (see .env.example + src/lib/r2.ts),
 * this same function starts listing real objects from the
 * "<slug>/" prefix in the R2 bucket instead — no callers need to change.
 */
export async function getAlbumImages(slug: string): Promise<GalleryImage[]> {
  const album = getAlbum(slug);
  if (!album) return [];

  if (isR2Configured()) {
    const keys = await listAlbumObjectKeys(`${slug}/`);
    return keys
      .filter((key) => /\.(jpe?g|png|webp|avif)$/i.test(key))
      .map((key) => ({
        id: key,
        src: publicUrlForKey(key),
        alt: `${album.title} photo`,
        // Real width/height aren't known without reading each file's
        // headers; the <GalleryImage> component falls back to a stable
        // aspect ratio via CSS when these are just hints.
        width: 1600,
        height: 1200,
      }));
  }

  return localPlaceholderImages(slug, album.photoCount);
}
