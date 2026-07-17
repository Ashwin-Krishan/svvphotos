"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navLinkClass = (active: boolean) =>
    [
      "rounded-full px-3 py-2 transition-colors",
      active
        ? "text-temple-gold"
        : "text-foreground/80 hover:bg-white/5 hover:text-foreground",
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-temple-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-temple-gold text-temple-maroon-dark font-display text-lg font-bold"
          >
            ॐ
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-wide sm:text-lg">
              Sri Varasiththi Vinaayagar Temple
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-temple-gold">
              Photo Gallery
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>
          <Link
            href="/photos"
            className={navLinkClass(pathname.startsWith("/photos"))}
          >
            Photos
          </Link>
          <a
            href="https://www.vinaayagar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-temple-crimson px-3 py-2 text-white transition-colors hover:bg-temple-crimson/85"
          >
            Main Site ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
