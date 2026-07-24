import { getAlbumImages, type GalleryImage } from "./images";
import { isR2Configured, publicUrlForKey } from "./r2";
import { getAlbum } from "./albums";
import { albumCoverOverrides } from "@/data/albumCovers";

/**
 * Cover photo for a given album — a manual override (src/data/albumCovers.ts)
 * if one's set for this slug, otherwise the first photo, for use as the
 * album's thumbnail.
 */
export async function getAlbumCoverPhoto(slug: string): Promise<GalleryImage | null> {
  const overrideKey = albumCoverOverrides[slug];
  if (overrideKey && isR2Configured()) {
    const album = getAlbum(slug);
    return {
      id: overrideKey,
      src: publicUrlForKey(overrideKey),
      alt: album ? `${album.title} photo` : "",
      width: 1600,
      height: 1200,
    };
  }

  const photos = await getAlbumImages(slug);
  return photos[0] ?? null;
}
