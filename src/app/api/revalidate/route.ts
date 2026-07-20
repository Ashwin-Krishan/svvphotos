import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation, called by the sync pipeline
 * (sync/lib/revalidate.ts) right after every run. ISR's revalidate=600
 * on the home/album pages is a safety net for organic traffic, but on a
 * low-traffic site that alone can leave a page stale indefinitely
 * between visits — a page only regenerates on the *next request* after
 * its window elapses, so if nobody happens to visit in between, nobody
 * ever triggers the refresh. This makes freshness immediate and
 * deterministic instead of "eventually, maybe."
 *
 * POST /api/revalidate?secret=...&slug=festival-2024
 * POST /api/revalidate?secret=...            (no slug = revalidate home only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const paths = ["/", ...(slug ? [`/photos/${slug}`] : [])];

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: paths, now: Date.now() });
}
