// Scheduled full-mirror sync: Google Drive inbox → Cloudflare R2 (or, pre-
// Phase-2, the local ./sync/local-output folder — see sync/lib/destination.ts).
// Invoked on a timer by .github/workflows/sync-photos.yml, or manually via
// `npm run sync:drive`.
import "dotenv/config";
import { walkDriveFolder } from "./lib/sources/driveSource";
import { loadManifest, saveManifest } from "./lib/manifest";
import { reconcileAlbums } from "./lib/albumsRegistry";
import { processNewFiles, processRemovals, summarize, type SyncStats } from "./lib/engine";

async function main() {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set — see .env.example.");
  }

  console.log("Walking Drive inbox folder tree...");
  const { files, topLevelFolderNames } = await walkDriveFolder(rootFolderId);
  console.log(
    `Found ${files.length} photo(s) across ${topLevelFolderNames.length} top-level folder(s): ${topLevelFolderNames.join(", ")}`
  );

  const manifest = await loadManifest();
  const stats: SyncStats = { added: [], removed: [], errors: [] };

  await processNewFiles(files, manifest, "drive", stats);

  const currentIds = new Set(files.map((f) => f.sourceId));
  await processRemovals(currentIds, manifest, "drive", stats);

  await saveManifest(manifest, summarize(stats));

  const { changed, added: addedAlbums, removed: removedAlbums } = await reconcileAlbums(
    topLevelFolderNames,
    { full: true }
  );
  if (changed) {
    console.log(
      `Albums updated — added: [${addedAlbums.join(", ")}], removed: [${removedAlbums.join(", ")}]`
    );
  }

  console.log(`Done: ${summarize(stats)}`);
  if (stats.errors.length) {
    console.log("Errors:");
    for (const e of stats.errors) console.log(`  - ${e.context}: ${e.message}`);
    // Non-fatal: a few bad files shouldn't fail the whole scheduled run.
  }
}

main().catch((err) => {
  console.error("Sync run failed:", err);
  process.exit(1);
});
