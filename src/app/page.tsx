import Link from "next/link";
import { albums } from "@/lib/albums";
import { getAlbumCoverPhoto } from "@/lib/heroPhotos";
import { HERO_VIDEO_URL } from "@/lib/siteAssets";
import VideoBackdrop from "@/components/VideoBackdrop";
import EmberField from "@/components/EmberField";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import AlbumCard from "@/components/AlbumCard";
import HeroText from "@/components/HeroText";
import MagneticButton from "@/components/MagneticButton";

// Without this, the home page's album cover photos would only ever
// reflect R2's contents as of the last full deploy — the same class of
// staleness bug as the album pages (src/app/photos/[slug]/page.tsx) had
// before revalidate was added there.
export const revalidate = 600;

export default async function HomePage() {
  const covers = await Promise.all(albums.map((a) => getAlbumCoverPhoto(a.slug)));

  return (
    <div>
      <section className="relative flex min-h-[85vh] items-center overflow-hidden px-4 text-center sm:px-6">
        <VideoBackdrop src={HERO_VIDEO_URL} />
        <EmberField />
        <HeroText firstAlbumSlug={albums[0].slug} />
      </section>

      <Marquee items={albums.map((a) => a.title)} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-temple-gold">
            Browse
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Every <span className="italic text-shine">celebration,</span>{" "}
            preserved.
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, i) => (
            <Reveal key={album.slug} delay={i * 0.06}>
              <AlbumCard album={album} cover={covers[i]} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-16 text-center sm:px-6">
        <Reveal>
          <p className="mx-auto max-w-xl font-display text-2xl italic text-foreground/80">
            For services, hours, and donations —
          </p>
          <MagneticButton className="mt-6">
            <Link
              href="https://www.vinaayagar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full border border-temple-gold/40 px-6 py-3 font-medium text-temple-gold transition-colors hover:bg-temple-gold/10"
            >
              Visit the Main Temple Site ↗
            </Link>
          </MagneticButton>
        </Reveal>
      </section>
    </div>
  );
}
