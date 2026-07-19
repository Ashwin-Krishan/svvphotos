import { compressToJpeg } from "./compress";
import { uploadToDestination, deleteFromDestination } from "./destination";
import { buildR2Key } from "./slug";
import type { Manifest, ManifestSource, SourceFile } from "./types";

export type SyncStats = {
  added: string[];
  removed: string[];
  errors: { context: string; message: string }[];
};

/**
 * Compresses + uploads every file not already in the manifest, recording
 * each success. A single bad/corrupt file is caught and logged rather
 * than aborting the whole run.
 */
export async function processNewFiles(
  files: SourceFile[],
  manifest: Manifest,
  source: ManifestSource,
  stats: SyncStats
): Promise<void> {
  for (const file of files) {
    if (manifest.entries[file.sourceId]) continue;

    const relPath = [...file.pathSegments, file.name].join("/");

    if (file.pathSegments.length === 0) {
      stats.errors.push({
        context: relPath,
        message: "Loose file directly in the inbox root has no album folder — skipped.",
      });
      continue;
    }

    try {
      const original = await file.read();
      const compressed = await compressToJpeg(original);
      const r2Key = buildR2Key(file.pathSegments, file.name);
      await uploadToDestination(compressed, r2Key);

      manifest.entries[file.sourceId] = {
        source,
        relPath,
        r2Key,
        size: compressed.length,
        modifiedTime: file.modifiedTime,
        syncedAt: new Date().toISOString(),
      };
      stats.added.push(relPath);
      console.log(`✓ ${relPath} → ${r2Key}`);
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
    `${stats.removed.length} removed`,
  ];
  if (stats.errors.length) parts.push(`${stats.errors.length} errors`);
  return parts.join(", ");
}
