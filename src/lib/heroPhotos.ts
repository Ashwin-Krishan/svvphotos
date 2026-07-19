import { getAlbumImages, type GalleryImage } from "./images";

/**
 * First photo of a given album, for use as its cover thumbnail. Purely a
 * UI-layer composition of the existing getAlbumImages() abstraction —
 * doesn't change how/where images are sourced.
 */
export async function getAlbumCoverPhoto(slug: string): Promise<GalleryImage | null> {
  const photos = await getAlbumImages(slug);
  return photos[0] ?? null;
}
