import { getFile, putFile } from "./github";
import { slugifySegment, parseEventAndYear } from "./slug";

const FILE_PATH = "src/data/albums.generated.json";

export type GeneratedAlbum = {
  slug: string;
  title: string;
  event: string;
  year: number | null;
  description: string;
  photoCount: number;
};

async function loadCurrent(): Promise<GeneratedAlbum[]> {
  const file = await getFile("main", FILE_PATH);
  if (!file) return [];
  return JSON.parse(file.content) as GeneratedAlbum[];
}

function makeAlbum(topLevelFolderName: string): GeneratedAlbum {
  const { event, year } = parseEventAndYear(topLevelFolderName);
  return {
    slug: slugifySegment(topLevelFolderName),
    title: topLevelFolderName,
    event,
    year,
    description: "",
    // No pre-generated local placeholders for auto-discovered albums —
    // 0 is fine, getAlbumImages() only reads photoCount in local/no-R2 mode.
    photoCount: 0,
  };
}

/**
 * Reconciles the site's album list against the top-level folder names
 * currently seen from a source walk, and writes the result to
 * src/data/albums.generated.json on `main` if anything changed.
 *
 * - full=true (the scheduled Drive sync, which sees the entire inbox):
 *   folder names are the full source of truth — albums whose folder no
 *   longer exists are removed, matching the "inbox is truth" model.
 * - full=false (the local on-demand path, which only ever sees the one
 *   folder it was pointed at): purely additive, so it never removes
 *   albums it didn't touch this run.
 *
 * Existing entries are matched by slug and keep their hand-edited
 * title/description if present, so manual polish survives re-runs.
 */
export async function reconcileAlbums(
  topLevelFolderNames: string[],
  { full }: { full: boolean }
): Promise<{ changed: boolean; added: string[]; removed: string[] }> {
  const current = await loadCurrent();
  const currentBySlug = new Map(current.map((a) => [a.slug, a]));
  const seenSlugs = new Set(topLevelFolderNames.map(slugifySegment));

  const added: string[] = [];
  const removed: string[] = [];

  const next: GeneratedAlbum[] = [];

  if (full) {
    for (const album of current) {
      if (seenSlugs.has(album.slug)) {
        next.push(album);
      } else {
        removed.push(album.slug);
      }
    }
  } else {
    next.push(...current);
  }

  for (const folderName of topLevelFolderNames) {
    const slug = slugifySegment(folderName);
    if (currentBySlug.has(slug)) continue;
    const album = makeAlbum(folderName);
    next.push(album);
    added.push(slug);
  }

  const changed = added.length > 0 || removed.length > 0;
  if (changed) {
    next.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
    const summary = [
      added.length ? `+${added.join(", ")}` : null,
      removed.length ? `-${removed.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    await putFile(
      "main",
      FILE_PATH,
      JSON.stringify(next, null, 2) + "\n",
      `Auto-register albums: ${summary}`
    );
  }

  return { changed, added, removed };
}
