import { getAlbum } from "./albums";
import { isR2Configured, listAlbumObjectKeys, publicUrlForKey } from "./r2";
import type { GalleryImage } from "./images";

export type Subalbum = {
  /** Slugified folder name as it appears in the R2 key, e.g. "day-1-pm". */
  slug: string;
  /** Humanized for display, e.g. "Day 1 PM". */
  title: string;
  photos: GalleryImage[];
};

export type AlbumContents = {
  /** Photos placed directly in the album's own Drive folder, with no day/sub-event subfolder. */
  ungrouped: GalleryImage[];
  /** One entry per immediate subfolder, naturally sorted (Day 2 before Day 10). */
  subalbums: Subalbum[];
};

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((word) =>
      word === "am" || word === "pm"
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

// Natural sort so "Day 2" sorts before "Day 10", and both sort correctly
// against "Day 3 PM" etc. regardless of what follows the number — always
// compare the leading numbers first, and only fall back to string
// comparison once those are equal (or absent). A plain string sort would
// put "day-10-am" before "day-3-pm" (comparing "1" < "3" as characters).
function naturalCompare(a: string, b: string): number {
  const numA = Number(a.match(/\d+/)?.[0]);
  const numB = Number(b.match(/\d+/)?.[0]);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
    return numA - numB;
  }
  return a.localeCompare(b);
}

/**
 * Groups an album's photos by their immediate Drive subfolder (e.g. "Day
 * 1 AM", "Day 1 PM", ...), matching the folder-is-the-album,
 * subfolder-is-the-subalbum convention the sync pipeline mirrors into R2
 * (see sync/lib/slug.ts buildR2Key). Falls back to a single ungrouped
 * list when there's no subfolder structure to show (including local
 * placeholder/demo mode, which never has one).
 */
export async function getAlbumContents(slug: string): Promise<AlbumContents> {
  const album = getAlbum(slug);
  if (!album || !isR2Configured()) return { ungrouped: [], subalbums: [] };

  const keys = await listAlbumObjectKeys(`${slug}/`);
  const imageKeys = keys.filter((key) => /\.(jpe?g|png|webp|avif)$/i.test(key));

  const ungrouped: GalleryImage[] = [];
  const bySubalbum = new Map<string, GalleryImage[]>();

  for (const key of imageKeys) {
    const rest = key.slice(slug.length + 1); // strip "<slug>/"
    const segments = rest.split("/");
    const image: GalleryImage = {
      id: key,
      src: publicUrlForKey(key),
      alt: `${album.title} photo`,
      width: 1600,
      height: 1200,
    };

    if (segments.length < 2) {
      ungrouped.push(image);
      continue;
    }

    const subalbumSlug = segments[0];
    if (!bySubalbum.has(subalbumSlug)) bySubalbum.set(subalbumSlug, []);
    bySubalbum.get(subalbumSlug)!.push(image);
  }

  const subalbums: Subalbum[] = [...bySubalbum.entries()]
    .sort(([a], [b]) => naturalCompare(a, b))
    .map(([subalbumSlug, photos]) => ({
      slug: subalbumSlug,
      title: humanize(subalbumSlug),
      photos,
    }));

  return { ungrouped, subalbums };
}
