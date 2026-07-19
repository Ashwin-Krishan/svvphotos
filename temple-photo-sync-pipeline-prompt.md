I have a photo gallery site for my local Hindu temple already built (separate project/chat handled the site itself — don't worry about building the gallery UI here). What I need now is the **automated photo pipeline** that feeds it: getting photos from their source (my camera / the temple priest's camera) into Cloudflare R2, compressed and organized, with as little manual effort as possible for both me and the priest.

## Phasing for this session

**I do NOT have Cloudflare R2 bucket/credentials set up yet** (approved, but not created). So for this session:

- **Build everything else fully and get it actually working**: the Google Drive inbox folder setup, the service account, the GitHub Actions scheduled job (detection, compression, full-mirror manifest logic including deletes), and the local on-demand script.
- **Write the "upload to R2" step as one clearly isolated, swappable function** (e.g. `uploadToDestination(filePath, albumPath)`) that for now just writes the compressed output to a local folder (or logs the intended destination path) instead of actually calling R2 — so the rest of the pipeline can be built and verified end-to-end today. Once I have real R2 credentials, only that one function needs to be filled in with the actual S3-compatible upload call; nothing else should need to change.
- Leave clear TODOs / a short README note for: (a) creating the R2 bucket once I have credentials, (b) filling in that upload function, (c) the caching/rate-limiting setup described below (that part does need Cloudflare, so it's fully phase 2).

## Context

- The gallery site displays images served from Cloudflare R2 (S3-compatible object storage), organized into albums/events.
- The temple has effectively unlimited Google Drive storage (~100TB) already, which I want to use as the "inbox" — the one place both I and the temple priest drop raw photos.
- **I have Cloudflare R2 approved but not yet created/configured** — build around this per the phasing note above; don't block on it.
- Important distinction: I separately keep a personal archive of ALL my raw/unedited SD card dumps in the temple's existing large Shared Drive — that is NOT related to this pipeline and should never be touched or scanned by it. The new dedicated inbox folder described below is a completely separate, purpose-built folder that only ever contains the photos that should currently be live on the website. **Whatever exists in that inbox folder at any given time is the literal source of truth for what's on the site** — so the sync should be a full mirror, not just an "add new stuff" job (see delete behavior below).
- Deployment/automation should live in the same GitHub repo as the gallery site, using GitHub Actions.

## Two photo sources feeding one pipeline

1. **The temple priest**, who is not technical. They currently take photos on their own camera and just drop them in a folder on their computer before posting to Facebook. I want them to do almost the exact same thing they already do, just into a shared Google Drive folder instead — no new tools, no login to any admin panel, no training. If they organize into subfolders by event name (which is close to their current habit), that subfolder name should become the album name on the site.
2. **Me**, uploading directly from my camera's SD card. My camera produces very large files, so anything I put in needs compression too. I want two options here:
   - Drop into the same Drive inbox folder as the priest (goes through the same automated pipeline), OR
   - A fast, on-demand path where I can tell you directly ("here's this folder, process and push it") and you compress + upload immediately using the same logic, without waiting on a scheduled run — since you'll have bash access to my machine in this session.

## What to build

1. **A Google Drive inbox structure** — a dedicated, single-purpose folder (e.g. `Temple Website Photos - Inbox`), created in the temple's admin/corporate Google account's My Drive — **not** inside the temple's existing larger Shared Drive (that one has other people's files and broader access already, and behaves oddly with Drive for Desktop for non-technical users). This inbox folder should be shared directly (via normal folder sharing, not shared-drive membership) with only the accounts that need it: the priest's personal email, mine, and later the service account used for the sync job. **The folder structure should mirror the album structure exactly, including nesting** — e.g. a top-level subfolder `Festival 2026` becomes a top-level album, and if it contains subfolders `Day 1`, `Day 2`, `Day 3`, those become sub-albums nested under `Festival 2026` on the site (photos loose directly in `Festival 2026` itself, if any, belong to that album directly rather than a sub-album). This should work for arbitrary nesting depth, not just one level — however deep the folder hierarchy goes in Drive, the album/sub-album hierarchy on the site should match it. Document exactly what sharing permissions each party needs (priest and I need Editor; the service account needs at least read access, or Editor if it will move files to a "Processed" subfolder).

2. **A scheduled sync job (GitHub Actions workflow)** that performs a **full mirror reconciliation** each run, not just additive uploads:
   - Runs on a timer (every 30–60 minutes is a reasonable default — check this against GitHub's free-tier Actions minutes; making the repo public removes the minute cap entirely if that's simpler)
   - Uses the Google Drive API to list every file currently in the inbox folder tree (a service account with read access to the inbox folder is the cleanest auth approach — walk me through setting that up)
   - Maintains a manifest/log of previously-processed file IDs and where each landed in R2
   - **New files** (IDs not yet in the manifest): download, compress/resize (target: ~2000–2500px on the long edge, single JPEG output only at ~80–85% quality — no separate WebP version, keeping this simple since R2 has no bandwidth/egress cost and load speed isn't a priority at our scale — using something like `sharp` or `imagemagick`/`mozjpeg`, whichever is more reliable in a GitHub Actions Linux runner), upload to the correct album path in R2 (mirroring the file's **full nested folder path** in Drive, e.g. a photo in `Festival 2026/Day 2` uploads to a matching nested path so the site's sub-album structure lines up), and add to the manifest
   - **Removed files** (IDs in the manifest but no longer present in the Drive folder): delete the corresponding compressed file from R2 and remove it from the manifest — the inbox folder is the source of truth, so anything deleted from Drive should disappear from the live site too
   - Handles errors gracefully (e.g. a corrupted file shouldn't kill the whole run)

3. **A reusable local script** (Node or Python, whichever matches the rest of the repo) that does the same compress-and-upload logic (single JPEG output, same manifest bookkeeping), callable directly against a local folder — this is what I'll invoke for the "SD card, process and push it now" fast path. It should share the actual compression/upload logic with the scheduled job rather than duplicating it (e.g. a shared module both the Action and the local script import).

4. **Secrets/config**: Google service account credentials and Cloudflare R2 credentials should be stored as GitHub Actions secrets (and a local `.env` — gitignored — for the manual script). Document exactly what values I need to generate/collect and where they go.

## Cost/abuse protection (phase 2 — needs Cloudflare, not this session)

- **Enable Cloudflare edge caching on the image-serving paths** (e.g. a Cache Everything rule or equivalent for the R2-backed image routes). This is the most important protection: repeated requests for the same photo should be served from Cloudflare's cache, not counted as a fresh R2 read operation each time. Set reasonable cache TTLs since these images rarely change once published.
- **Add a basic rate limiting rule** (the free Cloudflare plan includes one rate limiting rule per zone) on the image-serving route — something like capping requests per IP per minute — as a backstop against a script or bot repeatedly hitting the same endpoints.
- I've separately set up a Cloudflare Budget Alert on my account, so no action needed there from you, but keep this cost/abuse layer in mind when deciding how images are served (e.g. through a Worker or direct R2 public bucket) — favor whichever approach makes it easiest to apply caching and rate limiting in front of R2 once it exists.

## Constraints

- Keep this at effectively zero ongoing cost: Google Drive (already covered by the temple), GitHub Actions free tier, Cloudflare R2 (approved, cheap at our volume).
- No manual image editing or resizing should ever be required from me or the priest — the pipeline handles compression automatically regardless of source.
- Don't touch or rebuild the gallery site itself — assume it already exists and reads images from R2 in an album-per-folder structure; just make sure the paths this pipeline writes to match that structure (ask me if you need to confirm the exact path convention the site expects).

Please start by proposing the Drive folder structure, the GitHub Actions workflow design, and the shared compression module, then build it out.
