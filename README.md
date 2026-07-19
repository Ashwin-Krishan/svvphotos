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
    manifest.ts                  Tracks synced files on the sync-state branch
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
  nested R2 path. The current site only has flat, single-level album
  pages, so nested-folder photos merge into their parent album's photo
  grid today rather than getting their own "Day 2" tab — nothing is
  lost, sub-album browsing UI is a separate future addition if wanted.
- **State**: the manifest (which Drive/local files have already been
  synced, and where) lives as `manifest.json` on a dedicated
  **`sync-state`** branch — deliberately *not* `main`, so a routine sync
  run never triggers a Vercel redeploy. `src/data/albums.generated.json`
  *is* on `main`, since a brand-new album should trigger a rebuild so its
  page actually exists.

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

Standard Git → Vercel flow:

1. Push this repo to GitHub.
2. Import it into Vercel (Next.js is auto-detected).
3. Add the `R2_*` environment variables in the Vercel project settings
   once Phase 2 is live (see below).
4. **Custom subdomain**: after the first deploy, add a project domain in
   Vercel for `photos.vinaayagar.com` — Vercel will give you the exact
   CNAME/A record to add in DNS. This repo doesn't need any code changes
   for that step.

## Phase 2 — pending Cloudflare R2 sign-off

Cloudflare R2 is not set up yet (pending internal approval). Nothing in
this repo depends on it existing — the site runs fully on placeholders,
and the sync pipeline runs fully in local-output mode, until then. Once
approved:

- [ ] **(a) Create the R2 bucket** — see the TODO comments at the top of
      [src/lib/r2.ts](src/lib/r2.ts) for the exact steps (create bucket,
      create scoped API token, enable public access/custom domain, fill
      in `.env.local` and the GitHub Actions secrets).
- [x] **(b) Build the Google Drive → R2 sync** — done, see "Photo sync
      pipeline" above. `uploadToDestination()` /
      `deleteFromDestination()` in [sync/lib/destination.ts](sync/lib/destination.ts)
      are the only two functions that need real R2 to do something —
      they already do, automatically, once the env vars above are set.
- [ ] **(c) Add the custom subdomain in Vercel** once deployed — see
      "Deployment" above.
- [ ] **(d) Cloudflare edge caching + rate limiting** in front of the
      R2-backed image routes (cache-everything rule + one rate-limiting
      rule) — cost/abuse protection, needs Cloudflare so it's phase 2 too.
      Not yet started.
