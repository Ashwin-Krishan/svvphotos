import Link from "next/link";
import { albums } from "@/lib/albums";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-white/10 px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-temple-gold">
          Sri Varasiththi Vinaayagar Hindu Temple
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold sm:text-5xl">
          Photo Gallery
        </h1>
        <div className="mx-auto mt-5 h-px w-16 bg-temple-gold/40" />
        <p className="mx-auto mt-5 max-w-xl text-foreground/70">
          Moments from our festivals and celebrations — Mahotsavam,
          Navarathiri, Sivarathiri, Thiruvempavai, and more.
        </p>
        <Link
          href={`/photos/${albums[0].slug}`}
          className="mt-8 inline-block rounded-full bg-temple-crimson px-6 py-3 font-medium text-white transition-colors hover:bg-temple-crimson/85"
        >
          Browse Photos
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-temple-gold">
          Albums
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.slug}
              href={`/photos/${album.slug}`}
              className="group rounded-xl border border-white/10 bg-temple-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-temple-gold/30 hover:shadow-lg hover:shadow-black/30"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-temple-maroon/25 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-temple-gold">
                  {album.event}
                </span>
                <span className="font-display text-xl font-semibold text-temple-gold-dark">
                  {album.year}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {album.title}
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                {album.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-temple-crimson">
                View album
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
