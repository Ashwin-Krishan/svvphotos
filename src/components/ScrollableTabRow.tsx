"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps a horizontally-scrolling row of tab buttons with left/right
 * arrow buttons. Trackpads scroll horizontally with a two-finger swipe
 * for free, but a plain mouse wheel doesn't (needs Shift+scroll, which
 * most people never discover) — these arrows make the row navigable
 * without one. Arrows only render when there's actually more content to
 * reveal in that direction.
 */
export default function ScrollableTabRow({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, children]);

  const scrollBy = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute left-0 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-temple-surface text-foreground shadow-md ring-1 ring-white/10 hover:bg-white/10"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div
        ref={scrollerRef}
        aria-label={ariaLabel}
        className={[
          "scrollbar-none flex gap-2 overflow-x-auto scroll-smooth",
          canScrollLeft ? "pl-10" : "",
          canScrollRight ? "pr-10" : "",
        ].join(" ")}
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute right-0 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-temple-surface text-foreground shadow-md ring-1 ring-white/10 hover:bg-white/10"
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
