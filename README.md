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

1. **Upload** — drag a new event's photos into a Google Drive folder (via
   Drive for Desktop), one subfolder per event.
2. **Sync** — a scheduled job pulls new files from that Drive folder and
   pushes them into **Cloudflare R2** (S3-compatible, zero egress fees),
   which is what this site actually serves images from. Google blocked
   direct hotlinking from Drive in 2024, so Drive is upload-only storage,
   never the serving layer.
3. **Site** (this repo) — reads photos for each album/event and displays
   them in a tabbed gallery with a lightbox.

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
    albums.ts                 Album/event metadata (add new events here)
    images.ts                 getAlbumImages() — the abstraction described below
    r2.ts                     Cloudflare R2 (S3-compatible) client — inert until configured
scripts/
  generate-placeholders.mjs   Regenerates the local placeholder SVGs
  sync-drive-to-r2.ts         Phase 2 stub — see "Phase 2" below
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

## Adding a new album (today, placeholder mode)

1. Add an entry to `albums` in [src/lib/albums.ts](src/lib/albums.ts)
   (slug, title, event, year, description, photo count).
2. Run `npm run generate:placeholders` to regenerate placeholder images
   for it, or add real R2 photos once Phase 2 is live (see below) — no
   code changes needed either way.

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
this repo depends on it existing — the site runs fully on placeholders
until then. Once approved:

- [ ] **(a) Create the R2 bucket** — see the TODO comments at the top of
      [src/lib/r2.ts](src/lib/r2.ts) for the exact steps (create bucket,
      create scoped API token, enable public access/custom domain, fill
      in `.env.local`).
- [ ] **(b) Build the Google Drive → R2 sync** — the design is written up
      in [scripts/sync-drive-to-r2.ts](scripts/sync-drive-to-r2.ts)
      (currently a stub that throws if run). Implement it and wire it to
      a scheduled job (Vercel Cron or GitHub Actions) so new photos
      appear automatically after being dropped into the synced Drive
      folder.
- [ ] **(c) Add the custom subdomain in Vercel** once deployed — see
      "Deployment" above.
