import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AlbumTabs from "@/components/AlbumTabs";
import PhotoGrid from "@/components/PhotoGrid";
import { albums, getAlbum } from "@/lib/albums";
import { getAlbumImages } from "@/lib/images";

// Without this, the page would only ever reflect R2's contents as of the
// last full deploy — new photos synced into an *existing* album's R2
// folder wouldn't appear until something else triggered a rebuild. This
// makes Vercel re-render the page in the background at most every 10
// minutes, so newly-synced photos show up on their own between deploys.
export const revalidate = 600;

export function generateStaticParams() {
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) return {};
  return {
    title: `${album.title} | Photo Gallery`,
    description: album.description,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbum(slug);
  if (!album) notFound();

  const photos = await getAlbumImages(slug);

  return (
    <div>
      <AlbumTabs activeSlug={slug} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <span className="rounded-full bg-temple-maroon/25 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-temple-gold">
            {album.event}
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            {album.title}
          </h1>
          {album.description && (
            <p className="mt-1 text-foreground/60">{album.description}</p>
          )}
        </div>

        <PhotoGrid photos={photos} />
      </div>
    </div>
  );
}
