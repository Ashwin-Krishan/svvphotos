/**
 * Tells the deployed site "refresh these pages now" via the on-demand
 * revalidation API route (src/app/api/revalidate/route.ts), rather than
 * waiting on ISR's revalidate=600 to catch up on the next organic visit
 * — which, on a low-traffic site, could be a long wait. Best-effort: a
 * failed/skipped call just means ISR's 10-minute window becomes the
 * fallback, not a broken sync run.
 */
export async function notifySite(slugs: string[]): Promise<void> {
  const siteUrl = process.env.PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    console.log(
      "PUBLIC_SITE_URL/REVALIDATE_SECRET not set — skipping on-demand revalidation (falls back to ISR's 10-minute window)."
    );
    return;
  }

  const targets: (string | null)[] = slugs.length > 0 ? slugs : [null];

  for (const slug of targets) {
    const url = new URL("/api/revalidate", siteUrl);
    url.searchParams.set("secret", secret);
    if (slug) url.searchParams.set("slug", slug);

    try {
      const res = await fetch(url.toString(), { method: "POST" });
      if (res.ok) {
        console.log(`✓ Revalidated ${slug ? `/photos/${slug}` : "/"}`);
      } else {
        console.warn(`Revalidation request failed for ${slug ?? "/"}: ${res.status}`);
      }
    } catch (err) {
      console.warn(`Revalidation request errored for ${slug ?? "/"}:`, err);
    }
  }
}
