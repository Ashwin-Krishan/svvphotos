import Link from "next/link";
import { albums } from "@/lib/albums";

export default function AlbumTabs({ activeSlug }: { activeSlug: string }) {
  return (
    <div className="border-b border-white/10 bg-temple-surface">
      <nav
        aria-label="Photo albums"
        className="scrollbar-none mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6"
      >
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
      </nav>
    </div>
  );
}
