/** Turns a Drive/local folder name into a URL- and R2-key-safe slug segment. */
export function slugifySegment(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converts either EXIF-style "YYYY:MM:DD HH:MM:SS" (Drive's
 * imageMediaMetadata.time, i.e. actual capture time) or an ISO 8601
 * string (Drive's modifiedTime, or a local file's mtime) into a
 * zero-padded "YYYYMMDDHHMMSS" string. That format sorts lexicographically
 * in the same order it sorts chronologically, so prefixing it onto an R2
 * key makes the bucket's natural key order match capture order. Falls
 * back to a stable all-zero string when nothing parses, so files with
 * unknown times sort first as a group instead of scattering randomly
 * among the ones that do have a time.
 */
export function toSortableTimestamp(exifTime?: string, isoTime?: string): string {
  const exifMatch = exifTime?.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (exifMatch) {
    const [, y, mo, d, h, mi, s] = exifMatch;
    return `${y}${mo}${d}${h}${mi}${s}`;
  }
  if (isoTime) {
    const date = new Date(isoTime);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    }
  }
  return "00000000000000";
}

/**
 * Builds a full R2 object key from folder path segments + filename.
 * Output is always ".jpg" since compression always produces a single JPEG,
 * regardless of the source file's original extension.
 *
 * `capturedAt` (see toSortableTimestamp) is prefixed onto the filename so
 * that R2's lexicographic listing order — which is what the gallery
 * displays photos in — comes out chronological instead of alphabetical
 * by original camera filename (which interleaves badly once more than
 * one camera/phone contributes to the same folder).
 */
export function buildR2Key(pathSegments: string[], fileName: string, capturedAt?: string): string {
  const slugSegments = pathSegments.map(slugifySegment).filter(Boolean);
  const dot = fileName.lastIndexOf(".");
  const base = slugifySegment(dot > 0 ? fileName.slice(0, dot) : fileName);
  const prefix = capturedAt ? `${capturedAt}-` : "";
  return [...slugSegments, `${prefix}${base}.jpg`].join("/");
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
