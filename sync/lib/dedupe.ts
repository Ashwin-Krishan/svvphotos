import { createHash } from "node:crypto";
import { buildR2Key } from "./slug";
import type { SourceFile } from "./types";

/**
 * Two different source files can compute the exact same R2 key — e.g.
 * two cameras both naming a shot "80K1.JPG" and happening to capture it
 * within the same second, in the same folder. Since uploads are a plain
 * S3 PutObject (no existence check), a collision means one photo silently
 * overwrites the other and is gone for good.
 *
 * This groups the batch by computed key and, only for groups with more
 * than one file, assigns each a short deterministic disambiguator (a
 * hash of its stable sourceId) so their keys diverge. Sorted by sourceId
 * first so the assignment doesn't depend on listing order — the same
 * Drive file gets the same disambiguator on every run, so this doesn't
 * cause spurious re-keys once resolved. Files with no collision are left
 * untouched.
 */
export function assignKeyDisambiguators(files: SourceFile[]): void {
  const groups = new Map<string, SourceFile[]>();

  for (const file of files) {
    const key = buildR2Key(file.pathSegments, file.name, file.capturedAt);
    const group = groups.get(key);
    if (group) group.push(file);
    else groups.set(key, [file]);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
    for (const file of group) {
      file.keyDisambiguator = createHash("sha1").update(file.sourceId).digest("hex").slice(0, 8);
    }
  }
}

/**
 * Drops byte-identical copies of the same photo in the same folder — the
 * temple sometimes uploads a batch to Drive twice. Each copy gets its own
 * Drive file ID, so without this both would land in the gallery (and,
 * sharing a name and capture second, collide on the same R2 key). Keeps
 * the copy with the lowest sourceId so the choice is stable across runs.
 * The same photo in two *different* folders is left alone; that's an
 * intentional cross-album placement.
 */
export function dropExactDuplicates(files: SourceFile[]): { kept: SourceFile[]; dropped: SourceFile[] } {
  const byKey = new Map<string, SourceFile>();
  const dropped: SourceFile[] = [];
  const sorted = [...files].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  for (const file of sorted) {
    if (!file.contentHash) continue;
    const key = `${file.pathSegments.join("/")}\u0000${file.contentHash}`;
    if (byKey.has(key)) dropped.push(file);
    else byKey.set(key, file);
  }
  const droppedIds = new Set(dropped.map((f) => f.sourceId));
  return { kept: files.filter((f) => !droppedIds.has(f.sourceId)), dropped };
}
