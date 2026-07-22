"use client";

import { useState } from "react";
import PhotoGrid from "./PhotoGrid";
import ScrollableTabRow from "./ScrollableTabRow";
import type { AlbumContents } from "@/lib/subalbums";

export default function SubalbumBrowser({
  albumSlug,
  contents,
  initialSlug,
}: {
  albumSlug: string;
  contents: AlbumContents;
  initialSlug?: string;
}) {
  const tabs = [
    ...(contents.ungrouped.length > 0
      ? [{ slug: "__general__", title: "General", photos: contents.ungrouped }]
      : []),
    ...contents.subalbums,
  ];

  // A shared link points straight at a specific day. Falls back to the
  // first tab if the URL's day slug doesn't match anything (stale link,
  // typo, or that day no longer exists).
  const initialTab = tabs.find((t) => t.slug === initialSlug) ?? tabs[0];
  const [activeSlug, setActiveSlug] = useState(initialTab?.slug);
  const active = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  return (
    <div>
      <div className="mb-6">
        <ScrollableTabRow ariaLabel="Days">
          {tabs.map((tab) => {
            const isActive = tab.slug === active?.slug;
            const href = `/photos/${albumSlug}/${tab.slug}`;
            return (
              <a
                key={tab.slug}
                href={href}
                aria-current={isActive ? "true" : undefined}
                onClick={(e) => {
                  // Let modified clicks (open in new tab, etc.) behave
                  // natively. A plain click switches instantly client-side
                  // — every day's photos are already loaded, so there's
                  // no need to actually navigate/refetch — while still
                  // updating the address bar so the URL stays shareable.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                    return;
                  }
                  e.preventDefault();
                  setActiveSlug(tab.slug);
                  window.history.replaceState(null, "", href);
                }}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-temple-gold text-temple-maroon-dark"
                    : "bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground",
                ].join(" ")}
              >
                {tab.title}
                <span className="ml-1.5 text-xs opacity-70">
                  {tab.photos.length}
                </span>
              </a>
            );
          })}
        </ScrollableTabRow>
      </div>

      <PhotoGrid photos={active?.photos ?? []} />
    </div>
  );
}
