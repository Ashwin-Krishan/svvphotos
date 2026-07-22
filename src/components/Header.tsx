"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = (active: boolean) =>
    [
      "relative rounded-full px-3 py-2 transition-colors",
      active
        ? "text-temple-gold"
        : "text-foreground/80 hover:bg-white/5 hover:text-foreground",
    ].join(" ");

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40"
    >
      <div
        className={[
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 transition-colors duration-300 sm:px-6",
          scrolled
            ? "border-b border-white/10 bg-temple-surface/80 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        ].join(" ")}
      >
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
          <Link
            href="/videos"
            className={navLinkClass(pathname.startsWith("/videos"))}
          >
            Videos
          </Link>
          <a
            href="https://www.vinaayagar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-temple-crimson px-3 py-2 text-white transition-transform hover:scale-[1.04] hover:bg-temple-crimson/90"
          >
            Main Site ↗
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
