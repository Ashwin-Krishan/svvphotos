import type { Metadata } from "next";
import { videos } from "@/lib/videos";
import FeaturedVideoHero from "@/components/FeaturedVideoHero";
import VideoGallery from "@/components/VideoGallery";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Videos | Photo Gallery",
  description: "Video coverage of temple festivals and events.",
};

export default function VideosPage() {
  const [latest] = videos;

  return (
    <div>
      <FeaturedVideoHero video={latest} />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Reveal>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-temple-gold">
            All videos
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Every <span className="italic text-shine">event,</span> on record.
          </h2>
        </Reveal>

        <div className="mt-8">
          <VideoGallery videos={videos} />
        </div>
      </div>
    </div>
  );
}
