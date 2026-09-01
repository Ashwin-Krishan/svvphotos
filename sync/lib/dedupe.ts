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
