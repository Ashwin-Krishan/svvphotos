/**
 * PHASE 2 STUB — Google Drive → Cloudflare R2 sync bridge.
 *
 * Not implemented yet: this describes the design and fails loudly if run,
 * so it can't accidentally be relied on before R2 exists. Build this out
 * once Cloudflare R2 is approved and provisioned (see src/lib/r2.ts and
 * README.md's "Phase 2" section).
 *
 * Intended design:
 *
 * 1. Auth: use a Google Cloud service account (Drive API enabled) with
 *    read-only access to GOOGLE_DRIVE_ROOT_FOLDER_ID. Load credentials
 *    from GOOGLE_SERVICE_ACCOUNT_JSON (env var, not committed to git).
 *
 * 2. List: for each subfolder of the root folder, treat the subfolder
 *    name as an album slug (should match src/lib/albums.ts). List image
 *    files (jpg/png/heic) inside it via files.list, paginating with
 *    pageToken.
 *
 * 3. Diff: list existing objects in R2 under "<slug>/" (see
 *    listAlbumObjectKeys in src/lib/r2.ts) and skip any Drive file whose
 *    name (or file ID) already has a matching R2 object — this is what
 *    makes re-running the sync safe/idempotent after new photos are
 *    dropped into the synced Drive folder.
 *
 * 4. Transfer: for each new file, stream it from Drive
 *    (files.get with alt=media) directly into an R2 PutObjectCommand
 *    upload — avoid buffering full files in memory where possible, since
 *    these are unedited camera-original photos and may be large.
 *
 * 5. Naming: store objects as "<slug>/<original-filename>" so
 *    getAlbumImages() in src/lib/images.ts can list by prefix.
 *
 * 6. Schedule: run this on a timer (e.g. a Vercel Cron Job hitting an API
 *    route, or a simple GitHub Actions scheduled workflow) so new photos
 *    show up on the site within minutes of being dropped into the
 *    Drive-synced folder — no manual step beyond the initial drag-and-drop.
 *
 * Until this is built, adding a new event's photos requires no action on
 * the site itself — once R2 exists, this script (or its scheduled job)
 * is the only "sync" step left in the workflow described in
 * temple-photo-site-prompt.md.
 */

async function main(): Promise<void> {
  throw new Error(
    "sync-drive-to-r2 is a Phase 2 stub — implement after R2 is approved and provisioned. See the design notes at the top of this file."
  );
}

main();
