// Fast on-demand path: compress + push a local folder (e.g. an SD card
// dump synced to disk) straight to R2, without waiting for the scheduled
// Drive sync. Shares the exact same compress/upload/manifest logic as
// run-sync.ts (sync/lib/engine.ts) — this is just a different source.
//
// Usage:
//   npm run sync:local -- /path/to/folder ["Album Name"]
//
// The folder's own name (or the optional override) becomes the top-level
// album; nested subfolders inside it become nested sub-album path
// segments, exactly like the Drive-based sync.
import "dotenv/config";
import path from "node:path";
import { walkLocalFolder } from "./lib/sources/localSource";
import { loadManifest, saveManifest } from "./lib/manifest";
import { reconcileAlbums } from "./lib/albumsRegistry";
import { processNewFiles, summarize, type SyncStats } from "./lib/engine";
import { notifySite } from "./lib/revalidate";
import { slugifySegment } from "./lib/slug";

async function main() {
  const [folderArg, albumNameArg] = process.argv.slice(2);
  if (!folderArg) {
    console.error("Usage: npm run sync:local -- /path/to/folder [\"Album Name\"]");
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  const rootLabel = albumNameArg ?? path.basename(folderPath);

  console.log(`Walking ${folderPath} as album "${rootLabel}"...`);
  const { files, topLevelFolderNames } = await walkLocalFolder(folderPath, rootLabel);
  console.log(`Found ${files.length} photo(s).`);

  const manifest = await loadManifest();
  const stats: SyncStats = { added: [], removed: [], errors: [] };

  await processNewFiles(files, manifest, "local", stats);
  await saveManifest(manifest, summarize(stats));

  // Additive only — a one-off local run should never remove albums/photos
  // it didn't touch (that full-mirror behavior is the scheduled Drive
  // sync's job, since only that job ever sees the entire inbox at once).
  const { changed, added } = await reconcileAlbums(topLevelFolderNames, { full: false });
  if (changed) console.log(`New album registered: ${added.join(", ")}`);

  await notifySite(topLevelFolderNames.map(slugifySegment));

  console.log(`Done: ${summarize(stats)}`);
  if (stats.errors.length) {
    console.log("Errors:");
    for (const e of stats.errors) console.log(`  - ${e.context}: ${e.message}`);
  }
}

main().catch((err) => {
  console.error("Local sync failed:", err);
  process.exit(1);
});
