import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isR2Configured, getObject, putObject } from "../../src/lib/r2";
import type { Manifest } from "./types";

// Stored at the bucket root under a namespace no real album folder could
// ever collide with, and filtered out of every photo listing anyway
// (getAlbumImages/getAlbumContents only match image extensions).
const MANIFEST_KEY = "_sync/manifest.json";
const LOCAL_MANIFEST_PATH = path.join(__dirname, "..", "local-output", "_manifest.json");

/**
 * Loads the shared manifest (Drive/local file ID → R2 key mapping).
 *
 * Lives as a plain object in R2 itself, not a git-tracked file — it used
 * to live on a dedicated `sync-state` GitHub branch, but that hit a real
 * ceiling: GitHub's Git Blobs API tops out around 100MB per file, and
 * this manifest only grows (one entry per photo ever synced, never
 * pruned). R2 has no such ceiling at any scale this pipeline will ever
 * reach. Pre-Phase-2 (no R2 credentials), falls back to a local file so
 * the pipeline still works end-to-end for testing.
 */
export async function loadManifest(): Promise<Manifest> {
  if (isR2Configured()) {
    const buf = await getObject(MANIFEST_KEY);
    if (!buf) return { entries: {} };
    return JSON.parse(buf.toString("utf-8")) as Manifest;
  }

  try {
    const buf = await readFile(LOCAL_MANIFEST_PATH);
    return JSON.parse(buf.toString("utf-8")) as Manifest;
  } catch {
    return { entries: {} };
  }
}

/** Persists the manifest back to R2 (or the local fallback file pre-Phase-2). */
export async function saveManifest(manifest: Manifest, summary: string): Promise<void> {
  const content = JSON.stringify(manifest, null, 2);

  if (isR2Configured()) {
    await putObject(MANIFEST_KEY, Buffer.from(content), "application/json");
  } else {
    await mkdir(path.dirname(LOCAL_MANIFEST_PATH), { recursive: true });
    await writeFile(LOCAL_MANIFEST_PATH, content);
  }

  console.log(`Manifest saved (${summary})`);
}
