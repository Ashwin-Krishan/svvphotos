// Scheduled full-mirror sync: Google Drive inbox → Cloudflare R2 (or, pre-
// Phase-2, the local ./sync/local-output folder — see sync/lib/destination.ts).
// Invoked on a timer by .github/workflows/sync-photos.yml, or manually via
// `npm run sync:drive`.
import "dotenv/config";
import { walkDriveFolder } from "./lib/sources/driveSource";
import { loadManifest, saveManifest } from "./lib/manifest";
import { reconcileAlbums } from "./lib/albumsRegistry";
import { processNewFiles, processRemovals, summarize, type SyncStats } from "./lib/engine";
import { notifySite } from "./lib/revalidate";
import { slugifySegment } from "./lib/slug";

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

  // Safety guard: a full-mirror sync trusts this listing enough to delete
  // anything it doesn't see. An empty result is far more likely to mean
  // "folder not shared with the service account" / "wrong folder ID" /
  // "transient API hiccup" than "the priest deleted every album" — so
  // treat it as a suspected misconfiguration and skip the destructive
  // (removal) half of the reconciliation entirely rather than wiping out
  // every existing photo and album.
  if (topLevelFolderNames.length === 0) {
    console.warn(
      "⚠ Found 0 top-level folders in the Drive inbox. This almost always means the " +
        "inbox folder isn't shared with the service account yet, GOOGLE_DRIVE_ROOT_FOLDER_ID " +
        "is wrong, or the inbox is genuinely empty. Skipping album/photo removal this run " +
        "to avoid wiping the site — investigate before the next scheduled run."
    );
    console.log("Done: nothing to sync.");
    return;
  }

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

  // Always notify for every current album, not just the ones with
  // changes this run — cheap, and removes any chance of a page staying
  // stale because of an edge case in what "changed" means.
  await notifySite(topLevelFolderNames.map(slugifySegment));

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
