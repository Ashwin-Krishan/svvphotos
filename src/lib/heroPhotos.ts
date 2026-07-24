import { getAlbumImages, type GalleryImage } from "./images";
import { isR2Configured, listAlbumObjectKeys, publicUrlForKey } from "./r2";
import { getAlbum } from "./albums";
import { albumCoverOverrides } from "@/data/albumCovers";

// Sync pipeline prefixes filenames with a "YYYYMMDDHHMMSS-" sortable
// capture-time stamp (see sync/lib/slug.ts) — strip it so an override's
// original filename still matches the current, possibly re-keyed, object.
function stripSortPrefix(filename: string): string {
  return filename.replace(/^\d{14}-/, "");
}

/**
 * Finds the R2 object key matching an albumCoverOverrides entry
 * ("<subfolder>/<original filename>") regardless of any sortable-timestamp
 * prefix the sync pipeline has added to the actual filename, so this
 * keeps resolving correctly across re-keys instead of pinning to a
 * key that can silently stop existing.
 */
async function resolveOverrideKey(slug: string, override: string): Promise<string | null> {
  const overrideParts = override.split("/");
  const overrideFile = overrideParts.pop()!;
  const overrideDir = [slug, ...overrideParts].join("/");

  const keys = await listAlbumObjectKeys(`${overrideDir}/`);
  return (
    keys.find((key) => {
      const filename = key.slice(key.lastIndexOf("/") + 1);
      return stripSortPrefix(filename) === overrideFile;
    }) ?? null
  );
}

/**
 * Cover photo for a given album — a manual override (src/data/albumCovers.ts)
 * if one's set for this slug, otherwise the first photo, for use as the
 * album's thumbnail.
 */
export async function getAlbumCoverPhoto(slug: string): Promise<GalleryImage | null> {
  const override = albumCoverOverrides[slug];
  if (override && isR2Configured()) {
    const key = await resolveOverrideKey(slug, override);
    if (key) {
      const album = getAlbum(slug);
      return {
        id: key,
        src: publicUrlForKey(key),
        alt: album ? `${album.title} photo` : "",
        width: 1600,
        height: 1200,
      };
    }
  }

  const photos = await getAlbumImages(slug);
  return photos[0] ?? null;
}
