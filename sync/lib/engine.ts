import { compressToJpeg } from "./compress";
import { uploadToDestination, deleteFromDestination } from "./destination";
import { isR2Configured, copyObject, deleteObject } from "../../src/lib/r2";
import { buildR2Key } from "./slug";
import type { Manifest, ManifestSource, SourceFile } from "./types";

export type SyncStats = {
  added: string[];
  moved: string[];
  removed: string[];
  errors: { context: string; message: string }[];
};

/**
 * Compresses + uploads every file not already in the manifest at its
 * *current* Drive path, recording each success. A single bad/corrupt
 * file is caught and logged rather than aborting the whole run.
 *
 * Handles three cases per file:
 *  - never seen before → download, compress, upload, record
 *  - seen before, path unchanged → skip, nothing to do
 *  - seen before, path changed (moved to a different Drive folder) →
 *    a Drive move keeps the same file ID, so this shows up as an
 *    already-manifested file whose current pathSegments no longer match
 *    its recorded r2Key. Re-downloading and re-compressing an unchanged
 *    file just to move it would be wasteful — instead this does a
 *    server-side copy to the new key and deletes the old one.
 */
export async function processNewFiles(
  files: SourceFile[],
  manifest: Manifest,
  source: ManifestSource,
  stats: SyncStats
): Promise<void> {
  const currentDestination = isR2Configured() ? "r2" : "local";

  for (const file of files) {
    const relPath = [...file.pathSegments, file.name].join("/");

    if (file.pathSegments.length === 0) {
      stats.errors.push({
        context: relPath,
        message: "Loose file directly in the inbox root has no album folder — skipped.",
      });
      continue;
    }

    const newR2Key = buildR2Key(file.pathSegments, file.name, file.capturedAt);
    const existing = manifest.entries[file.sourceId];

    // Only trust the existing record if it was already synced to the
    // destination we're *currently* using. A file recorded under
    // "local" (because R2 wasn't configured yet at the time) still
    // needs a real upload once R2 goes live.
    if (existing && existing.destination === currentDestination) {
      if (existing.r2Key === newR2Key) continue; // unchanged, nothing to do

      // Moved to a different Drive folder since it was last synced.
      if (currentDestination === "r2") {
        try {
          await copyObject(existing.r2Key, newR2Key);
          await deleteObject(existing.r2Key);
          manifest.entries[file.sourceId] = {
            ...existing,
            relPath,
            r2Key: newR2Key,
            syncedAt: new Date().toISOString(),
          };
          stats.moved.push(`${existing.relPath} → ${relPath}`);
          console.log(`↷ moved ${existing.relPath} → ${relPath}`);
        } catch (err) {
          stats.errors.push({
            context: relPath,
            message: err instanceof Error ? err.message : String(err),
          });
          console.error(`✗ failed to move ${existing.relPath} → ${relPath}: ${err}`);
        }
        continue;
      }
      // Local (dev) mode has no cheap move — fall through and
      // reprocess it like a new file at the new path.
    }

    try {
      const original = await file.read();
      const compressed = await compressToJpeg(original);
      await uploadToDestination(compressed, newR2Key);

      manifest.entries[file.sourceId] = {
        source,
        destination: currentDestination,
        relPath,
        r2Key: newR2Key,
        size: compressed.length,
        modifiedTime: file.modifiedTime,
        syncedAt: new Date().toISOString(),
      };
      stats.added.push(relPath);
      console.log(`✓ ${relPath} → ${newR2Key}`);
    } catch (err) {
      stats.errors.push({
        context: relPath,
        message: err instanceof Error ? err.message : String(err),
      });
      console.error(`✗ ${relPath}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

/**
 * Deletes anything the manifest still has recorded (for the given source)
 * that no longer appears in the current file listing — the "full mirror"
 * half of the reconciliation. Only meaningful when the caller has a
 * complete listing to compare against (the scheduled Drive sync); the
 * local on-demand path never calls this.
 */
export async function processRemovals(
  currentSourceIds: Set<string>,
  manifest: Manifest,
  source: ManifestSource,
  stats: SyncStats
): Promise<void> {
  const toRemove = Object.entries(manifest.entries).filter(
    ([id, entry]) => entry.source === source && !currentSourceIds.has(id)
  );

  for (const [id, entry] of toRemove) {
    try {
      await deleteFromDestination(entry.r2Key);
      delete manifest.entries[id];
      stats.removed.push(entry.relPath);
      console.log(`− removed ${entry.relPath} (${entry.r2Key})`);
    } catch (err) {
      stats.errors.push({
        context: entry.relPath,
        message: err instanceof Error ? err.message : String(err),
      });
      console.error(`✗ failed to remove ${entry.relPath}: ${err}`);
    }
  }
}

export function summarize(stats: SyncStats): string {
  const parts = [
    `${stats.added.length} added`,
    `${stats.moved.length} moved`,
    `${stats.removed.length} removed`,
  ];
  if (stats.errors.length) parts.push(`${stats.errors.length} errors`);
  return parts.join(", ");
}
