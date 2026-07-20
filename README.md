# Temple Photo Gallery

Companion photo gallery site for [Sri Varasiththi Vinaayagar Hindu Temple of
Toronto](https://www.vinaayagar.com), intended to be deployed on a subdomain
(e.g. `photos.vinaayagar.com`). The main Wix site (donations, service hours,
etc.) is untouched — this is a separate, purpose-built site just for event
photos.

Built with Next.js (App Router) + Tailwind CSS, deployed on Vercel.

## Why this exists

The Wix site's built-in photo uploader is slow for bulk, unedited event
photos straight off an SD card. The intended workflow instead is:

1. **Upload** — the temple priest (or I) drop a new event's photos into a
   shared Google Drive inbox folder, organized into one subfolder per
   event (nesting allowed, e.g. `Festival 2026/Day 2`).
2. **Sync** — a scheduled GitHub Action ([sync/run-sync.ts](sync/run-sync.ts))
   pulls new files from that Drive folder, compresses them, and pushes
   them into **Cloudflare R2** (S3-compatible, zero egress fees), which is
   what this site actually serves images from. Google blocked direct
   hotlinking from Drive in 2024, so Drive is upload-only storage, never
   the serving layer. It's a full-mirror sync — anything removed from the
   Drive inbox is removed from the live site too. New albums are
   registered automatically; no code changes needed for a new event.
3. **Site** (this repo) — reads photos for each album/event and displays
   them in a tabbed gallery with a lightbox.

See "Photo sync pipeline" below for the full setup walkthrough.

## Project structure

```
src/
  app/
    page.tsx                 Home page (hero + album cards)
    photos/page.tsx           Redirects to the first album
    photos/[slug]/page.tsx    Album page: tabs + photo grid + lightbox
  components/
    Header.tsx, Footer.tsx
    AlbumTabs.tsx             Tab navigation across all albums/events
    PhotoGrid.tsx             Masonry grid + built-in lightbox (client)
  lib/
    albums.ts                 Reads src/data/albums.generated.json
    images.ts                 getAlbumImages() — the abstraction described below
    r2.ts                     Cloudflare R2 (S3-compatible) client — put/get/delete/list
  data/
    albums.generated.json     Album list — kept up to date by the sync pipeline
scripts/
  generate-placeholders.mjs   Regenerates the local placeholder SVGs
sync/
  run-sync.ts                 Scheduled full-mirror sync: Drive -> R2 (npm run sync:drive)
  local-cli.ts                 On-demand path: local folder -> R2 (npm run sync:local)
  lib/
    sources/driveSource.ts     Recursively walks the Drive inbox tree
    sources/localSource.ts     Recursively walks a local folder (same shape as Drive)
    compress.ts                 sharp: resize to <=2400px longest edge, JPEG q82
    destination.ts               uploadToDestination() / deleteFromDestination() — swappable, see below
    manifest.ts                  Tracks synced files as a JSON object in R2
    albumsRegistry.ts            Auto-registers new albums into albums.generated.json
    engine.ts                    Shared new/removed reconciliation logic
    github.ts                    Minimal GitHub API client used by manifest.ts/albumsRegistry.ts
.github/workflows/
  sync-photos.yml               Runs sync/run-sync.ts every 30 minutes
```

## The image abstraction

`getAlbumImages(slug)` in [src/lib/images.ts](src/lib/images.ts) is the only
place that knows where photos actually live:

- **Today**: no `R2_*` env vars are set, so it reads generated placeholder
  SVGs from `public/placeholders/<slug>/`. These are lightweight (~4KB
  each), not real photos — real photos are never committed to this repo.
- **Once R2 is configured**: the same function automatically lists real
  objects from the R2 bucket instead. No page or component needs to
  change — they all just call `getAlbumImages(slug)`.

## Adding a new album

Once the sync pipeline is running (see below), you never need to touch
this repo for a new event — dropping a new top-level folder into the
Drive inbox registers it as an album automatically. For local
placeholder-mode testing before the pipeline exists, you can still add
one by hand: add an entry to `src/data/albums.generated.json` and run
`npm run generate:placeholders`.

## Photo sync pipeline

This is what turns "photos dropped in Google Drive" into photos live on
the site, with no manual editing/uploading/resizing by me or the priest.
Full design notes live in
[temple-photo-sync-pipeline-prompt.md](temple-photo-sync-pipeline-prompt.md).

### How it works

- **`npm run sync:drive`** ([sync/run-sync.ts](sync/run-sync.ts)) — the
  scheduled path (runs every 30 min via
  [.github/workflows/sync-photos.yml](.github/workflows/sync-photos.yml),
  or manually via the Actions tab's "Run workflow" button). Walks the
  entire Drive inbox tree, compresses+uploads anything new, deletes
  anything removed from Drive, and registers any brand-new top-level
  folder as an album. This is a **full mirror**: the inbox folder is the
  literal source of truth for what's live.
- **`npm run sync:local -- /path/to/folder`**
  ([sync/local-cli.ts](sync/local-cli.ts)) — the fast on-demand path for
  pushing photos straight from an SD card without waiting for Drive or
  the schedule. Same compression/upload/manifest logic, just a different
  source; purely additive (never deletes).
- Both share [sync/lib/engine.ts](sync/lib/engine.ts) for the actual
  compress → upload → manifest-update logic, so there's exactly one
  implementation of that behavior.
- **Nested folders** (e.g. `Festival 2026/Day 2`) mirror into a matching
  nested R2 path, and the album page ([src/lib/subalbums.ts](src/lib/subalbums.ts),
  [src/components/SubalbumBrowser.tsx](src/components/SubalbumBrowser.tsx))
  groups them into clickable day tabs automatically — folder = album,
  subfolder = sub-album, natural-sorted (Day 2 before Day 10).
- **State**: the manifest (which Drive/local files have already been
  synced, and where) lives as a single JSON object at `_sync/manifest.json`
  in the R2 bucket itself — not a git-tracked file. It used to live on a
  dedicated `sync-state` GitHub branch, but that hit a real ceiling:
  GitHub's Git Blobs API tops out around 100MB per file, and this
  manifest only grows (one entry per photo ever synced). R2 has no such
  limit at any scale this pipeline will realistically reach. Storing it
  outside `main` was never about the ceiling, though — it's so a routine
  sync run never triggers a Vercel redeploy. `src/data/albums.generated.json`
  *is* on `main`, since a brand-new album should trigger a rebuild so its
  page actually exists.
- **Freshness**: album/home pages use ISR (`revalidate = 600`), which is
  a safety net, not the primary mechanism — ISR only regenerates a page
  on the *next visit* after its window elapses, so a low-traffic page
  could sit stale indefinitely between visits. Every sync run also calls
  [sync/lib/revalidate.ts](sync/lib/revalidate.ts), which hits the
  deployed site's `/api/revalidate` route
  ([src/app/api/revalidate/route.ts](src/app/api/revalidate/route.ts))
  to force an immediate refresh of every current album + the home page.
  Needs `PUBLIC_SITE_URL` + `REVALIDATE_SECRET` set identically in three
  places (local `.env`, GitHub Actions secrets, Vercel env vars) — if
  either is missing the pipeline just logs a note and falls back to
  ISR's 10-minute window instead of failing the run.

### One-time setup

**1. Create the Drive inbox folder**

In the temple's Google admin account, create a folder named e.g.
`Temple Website Photos - Inbox` in **My Drive** (not the existing Shared
Drive — that one has broader access and is unrelated to this pipeline;
never point this pipeline at it). Share it (regular folder sharing, not
Shared Drive membership) as **Editor** with:
- the priest's email
- your email
- the service account's email (created in step 2) — **Viewer** is enough,
  the pipeline only reads

Inside it, one subfolder per event (e.g. `Mahotsavam 2026`), with
optional nested subfolders for sub-events (e.g. `Mahotsavam 2026/Day 1`).
Loose photos directly in an event folder belong to that album directly.

**2. Create a Google Cloud service account**

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   a project (or reuse one) and enable the **Google Drive API**.
2. Create a **Service Account** (IAM & Admin > Service Accounts). No
   special roles needed — access comes entirely from sharing the Drive
   folder with its email in step 1.
3. Create a JSON key for it and download it. This is the
   `GOOGLE_SERVICE_ACCOUNT_JSON` value — paste the whole file's contents
   (or base64-encode it) as one secret.
4. Copy the service account's email (`...@<project>.iam.gserviceaccount.com`)
   and share the inbox folder with it as in step 1.
5. Get the inbox folder's ID from its Drive URL
   (`drive.google.com/drive/folders/<THIS PART>`) — this is
   `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

**3. Add GitHub Actions secrets**

In this repo's Settings > Secrets and variables > Actions, add:
`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, and (once
Phase 2 is live) `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. No GitHub
token needed — Actions provides one automatically.

**4. Local `.env` (for the on-demand path)**

Copy `.env.example` to `.env` (gitignored) and fill in the same values.
If you have `gh auth login`'d, you can leave `GITHUB_TOKEN` blank — the
pipeline falls back to `gh auth token` automatically.

### Before R2 exists

Everything above works today without any R2 credentials: compression,
Drive listing, manifest bookkeeping, and album auto-registration are all
fully live. `uploadToDestination()` /`deleteFromDestination()` in
[sync/lib/destination.ts](sync/lib/destination.ts) just write to
`./sync/local-output/` instead of R2 in the meantime — inspect that
folder to verify a run worked. The moment `R2_*` secrets/env vars are
set, both entry points start actually uploading/deleting in R2, with
zero code changes.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` if/when you want to point the site at
real R2 data (leave it absent to keep using placeholders).

## Deployment

Standard Git → Vercel flow — **the Vercel project is connected to this
GitHub repo's `main` branch and auto-deploys on every push.** That's the
only deploy path that should ever be used:

1. `git push` to `main` → Vercel picks it up and deploys automatically
   within seconds. This is reliable and always reflects the true repo
   state — verified repeatedly.
2. **Don't run `vercel deploy --prod` (or any CLI deploy) unless you've
   just run `git fetch origin main && git status` and confirmed your
   local checkout has zero divergence from `origin/main`.** A CLI deploy
   uploads whatever's in your local working directory, not what's on
   GitHub — and the sync pipeline commits directly to `main` via the
   GitHub API (album auto-registration), completely bypassing any local
   git checkout. A stale local branch + a CLI deploy will silently
   *regress* the live site to older data with no error or warning. This
   happened once already (see git history around the "Festival 2026"
   album going temporarily missing) — always prefer `git push` and let
   Vercel's own Git integration handle it.
3. Environment variables (`R2_*`, `PUBLIC_SITE_URL`, `REVALIDATE_SECRET`)
   live in the Vercel project's own settings — see "Photo sync pipeline"
   above for what each one is for. They're separate from GitHub Actions
   secrets; both need to be set independently since they're different
   environments (learned this the hard way — R2 secrets existed in
   GitHub Actions for a while before anyone realized Vercel needed its
   own copy too).
4. **Custom subdomain**: already configured — `photos.vinaayagar.com` is
   aliased to this Vercel project.

## Cost/abuse protection — not yet started

- [ ] Cloudflare edge caching + rate limiting in front of the R2-backed
      image routes (cache-everything rule + one rate-limiting rule) —
      repeated requests for the same photo should hit Cloudflare's cache,
      not count as a fresh R2 read each time.
