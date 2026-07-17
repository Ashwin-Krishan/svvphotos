I'm building a photo gallery site for my local Hindu temple, as a companion to their main site. Here's the full context and plan — please pick up from here and start building.

## Background

- The temple's main site is https://www.vinaayagar.com, built on Wix. It handles donation payments, so **it stays on Wix untouched** — we are not migrating it or modifying it in any way.
- I want a **separate photo gallery site** on a subdomain (e.g. `photos.vinaayagar.com`). I have access to DNS for the domain and will add the subdomain record myself once the new site is deployed somewhere (Vercel will give me the exact record to add).
- The existing Wix site already has a "Photos" section organized by event (examples of past events: Mahotsavam 2021–2024, Sivarathiri 2023, Thiruvempavai 2023, Navarathiri 2024). The new gallery site should follow a similar structure: organized into albums/events, each with its own set of photos.
- I take a lot of unedited photos at temple events straight off my camera's SD card. My core requirement is that adding a new batch of event photos should be as close to "one click" as possible — no manual per-photo editing or uploading through a slow web UI (that's the exact pain point that made me want to move off Wix's built-in photo uploader in the first place).

## Workflow this needs to support

1. **Upload step (my side):** I'll use Google Drive for Desktop, which syncs a local folder to Drive automatically. I drag a new event's photos from my SD card into that synced folder, organized in a subfolder per event. The temple already has effectively unlimited Google Drive storage (~100TB), so Drive is the intended raw storage/upload point.
2. **Sync bridge (needs to be built):** Because Google Drive is not reliable as a direct public image host (Google blocked external hotlinking of Drive images in 2024), there needs to be a sync process that pulls new photos from the designated Google Drive folder(s) via the Google Drive API and pushes them into **Cloudflare R2** (S3-compatible object storage, chosen for its zero egress fees and cheap storage cost). This is what the public site will actually serve images from.
3. **Site (needs to be built):** A gallery site — organized by event/album, similar structure to the existing Wix photo section — that displays images served from Cloudflare R2. Should be reasonably fast, mobile-friendly, and simple to browse (grid of albums → grid of photos per album, lightbox/full view on click is a nice-to-have).
4. **Deployment workflow:** Same pattern I use for my other projects — code in a GitHub repo, connected to Vercel, so pushing to GitHub auto-deploys. Please scaffold it this way (a standard git repo, ready to push to GitHub and import into Vercel).

## Important constraint for this session

**I do NOT have Cloudflare R2 approved/set up yet** — I need to get internal sign-off before creating that account and wiring in real credentials. So for this session:

- **Do** scaffold the full site: project structure, gallery/album UI, routing per event, styling, placeholder/sample images (a small handful of lightweight placeholder images only — do not bulk-load real photos into the git repo, since the whole point of this architecture is that real photos live in R2, not in git).
- **Do** build the image-fetching layer so it's abstracted behind a config/utility (e.g. an `getAlbumImages()` function or similar) that currently reads from local placeholders, but is structured so swapping in real Cloudflare R2 (via S3-compatible SDK) later is a matter of filling in environment variables and pointing that function at R2 instead of local files.
- **Do** leave clear TODO comments / a short README section for: (a) creating the R2 bucket once approved, (b) the Google Drive → R2 sync script (this can be stubbed out or described, not fully built, until R2 exists), (c) adding the custom subdomain in Vercel once deployed.
- **Don't** set up real Cloudflare R2 credentials, don't ask me to create the R2 account as part of this session — treat it as a "phase 2, pending approval" step.

## Tech preferences

- I'm comfortable with standard modern web tooling (I do this professionally) — Next.js (or similar React-based static/SSR framework) is fine, whatever you think fits best for an image-heavy gallery site deployed on Vercel.
- Keep the repo lightweight — no real bulk photo assets committed to git, per the constraint above.

Please start by proposing the project structure and gallery UI approach, then scaffold it out.
