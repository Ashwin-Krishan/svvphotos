"use client";

import { useState } from "react";
import PhotoGrid from "./PhotoGrid";
import ScrollableTabRow from "./ScrollableTabRow";
import type { AlbumContents } from "@/lib/subalbums";

export default function SubalbumBrowser({ contents }: { contents: AlbumContents }) {
  const tabs = [
    ...(contents.ungrouped.length > 0
      ? [{ slug: "__general__", title: "General", photos: contents.ungrouped }]
      : []),
    ...contents.subalbums,
  ];

  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug);
  const active = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  return (
    <div>
      <div className="mb-6">
        <ScrollableTabRow ariaLabel="Days">
          {tabs.map((tab) => {
            const isActive = tab.slug === active?.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setActiveSlug(tab.slug)}
                aria-current={isActive ? "true" : undefined}
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
              </button>
            );
          })}
        </ScrollableTabRow>
      </div>

      <PhotoGrid photos={active?.photos ?? []} />
    </div>
  );
}
