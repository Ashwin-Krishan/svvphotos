import { getFile, putFile } from "./github";
import type { Manifest } from "./types";

const BRANCH = "sync-state";
const FILE_PATH = "manifest.json";

/**
 * Loads the shared manifest (Drive/local file ID → R2 key mapping) from
 * its dedicated `sync-state` branch. That branch is isolated from `main`
 * on purpose: this file changes on every sync run, and main is what
 * Vercel watches for deploys — we don't want a photo sync to trigger a
 * site redeploy every 30-60 minutes.
 */
export async function loadManifest(): Promise<Manifest> {
  const file = await getFile(BRANCH, FILE_PATH);
  if (!file) return { entries: {} };
  return JSON.parse(file.content) as Manifest;
}

/** Persists the manifest back to the sync-state branch. */
export async function saveManifest(manifest: Manifest, summary: string): Promise<void> {
  await putFile(
    BRANCH,
    FILE_PATH,
    JSON.stringify(manifest, null, 2) + "\n",
    `Sync: ${summary}`
  );
}
