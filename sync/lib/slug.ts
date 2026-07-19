/** Turns a Drive/local folder name into a URL- and R2-key-safe slug segment. */
export function slugifySegment(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds a full R2 object key from folder path segments + filename.
 * Output is always ".jpg" since compression always produces a single JPEG,
 * regardless of the source file's original extension.
 */
export function buildR2Key(pathSegments: string[], fileName: string): string {
  const slugSegments = pathSegments.map(slugifySegment).filter(Boolean);
  const dot = fileName.lastIndexOf(".");
  const base = slugifySegment(dot > 0 ? fileName.slice(0, dot) : fileName);
  return [...slugSegments, `${base}.jpg`].join("/");
}

/**
 * Splits a top-level folder name like "Mahotsavam 2024" into an event name
 * and a trailing year, if present. Falls back to the whole name as the
 * event with no year when there's no trailing 4-digit year.
 */
export function parseEventAndYear(topLevelFolderName: string): {
  event: string;
  year: number | null;
} {
  const match = topLevelFolderName.match(/^(.*?)\s*(\d{4})\s*$/);
  if (match) {
    return { event: match[1].trim(), year: Number(match[2]) };
  }
  return { event: topLevelFolderName.trim(), year: null };
}
