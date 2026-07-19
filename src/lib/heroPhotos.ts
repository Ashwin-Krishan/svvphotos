import { albums } from "./albums";
import { getAlbumImages, type GalleryImage } from "./images";

/**
 * Pulls a small handful of real photos across albums for use as
 * marketing/hero-style backdrops (home hero slideshow, album cover
 * thumbnails). Purely a UI-layer composition of the existing
 * getAlbumImages() abstraction — doesn't change how/where images are
 * sourced (still local placeholders pre-R2, real R2 objects once
 * configured), just picks a few to feature.
 */
export async function getHeroPhotos(limit = 6): Promise<GalleryImage[]> {
  const picks: GalleryImage[] = [];
  for (const album of albums) {
    if (picks.length >= limit) break;
    const photos = await getAlbumImages(album.slug);
    if (photos[0]) picks.push(photos[0]);
  }
  return picks.slice(0, limit);
}

/** First photo of a given album, for use as its cover thumbnail. */
export async function getAlbumCoverPhoto(slug: string): Promise<GalleryImage | null> {
  const photos = await getAlbumImages(slug);
  return photos[0] ?? null;
}
