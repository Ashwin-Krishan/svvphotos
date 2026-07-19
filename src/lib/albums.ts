import generatedAlbums from "@/data/albums.generated.json";

export type Album = {
  /** URL slug, e.g. /photos/mahotsavam-2024 */
  slug: string;
  /** Event name shown on the tab and album header */
  title: string;
  /** Festival/occasion this event belongs to, used to group tabs */
  event: string;
  year: number | null;
  description: string;
  /** How many placeholder photos to render for this album in dev/demo mode */
  photoCount: number;
};

// Sourced from src/data/albums.generated.json, which the sync pipeline
// (sync/lib/albumsRegistry.ts) keeps up to date automatically: every top-
// level folder in the Google Drive inbox becomes an album here with zero
// manual edits required. This file just seeds/reads it — see README.md's
// "Photo sync pipeline" section for how the pipeline updates it.
export const albums: Album[] = generatedAlbums as Album[];

export function getAlbum(slug: string): Album | undefined {
  return albums.find((a) => a.slug === slug);
}

export const defaultAlbumSlug = albums[0].slug;
