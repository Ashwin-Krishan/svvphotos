import Link from "next/link";
import { albums } from "@/lib/albums";
import ScrollableTabRow from "./ScrollableTabRow";

export default function AlbumTabs({ activeSlug }: { activeSlug: string }) {
  return (
    <div className="sticky top-16 z-30 border-b border-white/10 bg-temple-surface/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <ScrollableTabRow ariaLabel="Photo albums">
          {albums.map((album) => {
            const isActive = album.slug === activeSlug;
            return (
              <Link
                key={album.slug}
                href={`/photos/${album.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-temple-gold text-temple-maroon-dark"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground",
                ].join(" ")}
              >
                {album.title}
              </Link>
            );
          })}
        </ScrollableTabRow>
      </div>
    </div>
  );
}
