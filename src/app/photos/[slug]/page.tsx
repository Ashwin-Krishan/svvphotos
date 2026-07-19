import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import AlbumTabs from "@/components/AlbumTabs";
import PhotoGrid from "@/components/PhotoGrid";
import SubalbumBrowser from "@/components/SubalbumBrowser";
import Reveal from "@/components/Reveal";
import { albums, getAlbum } from "@/lib/albums";
import { getAlbumImages } from "@/lib/images";
import { getAlbumContents } from "@/lib/subalbums";

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

  const [photos, contents] = await Promise.all([
    getAlbumImages(slug),
    getAlbumContents(slug),
  ]);
  const cover = photos[0];
  const hasSubalbums = contents.subalbums.length > 0;

  return (
    <div>
      <section className="relative flex h-[46vh] min-h-[320px] items-end overflow-hidden">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-temple-maroon to-temple-maroon-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
        <div className="kolam-grid absolute inset-0 opacity-30" />

        <Reveal className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-temple-gold backdrop-blur-sm">
            {album.event}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-5xl">
            {album.title}
          </h1>
          {album.description && (
            <p className="mt-2 max-w-xl text-foreground/70">{album.description}</p>
          )}
        </Reveal>
      </section>

      <AlbumTabs activeSlug={slug} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {hasSubalbums ? (
          <SubalbumBrowser contents={contents} />
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </div>
  );
}
