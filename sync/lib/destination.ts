// The one isolated, swappable "where do compressed photos actually go"
// module. Today (pre-Phase-2 / no R2 credentials) it writes to a local
// folder instead. Once R2 credentials exist (see src/lib/r2.ts and
// .env.example), isR2Configured() flips true and every call here
// automatically starts hitting real R2 — nothing else in the pipeline
// needs to change.
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { isR2Configured, putObject, deleteObject } from "../../src/lib/r2";

const LOCAL_OUTPUT_DIR = path.join(__dirname, "..", "local-output");

/**
 * Uploads (or, pre-Phase-2, locally writes) a compressed JPEG to the given
 * R2 key, e.g. "mahotsavam-2026/day-2/img-0042.jpg".
 */
export async function uploadToDestination(
  compressed: Buffer,
  r2Key: string
): Promise<void> {
  if (isR2Configured()) {
    await putObject(r2Key, compressed);
    return;
  }

  const destPath = path.join(LOCAL_OUTPUT_DIR, r2Key);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, compressed);
  console.log(`[local mode] wrote ${destPath} (would upload to r2://${r2Key})`);
}

/** Removes a previously-uploaded photo — used by the full-mirror delete step. */
export async function deleteFromDestination(r2Key: string): Promise<void> {
  if (isR2Configured()) {
    await deleteObject(r2Key);
    return;
  }

  const destPath = path.join(LOCAL_OUTPUT_DIR, r2Key);
  await rm(destPath, { force: true });
  console.log(`[local mode] removed ${destPath} (would delete r2://${r2Key})`);
}
