import type { Metadata } from "next";
import { HERO_VIDEO_URL } from "@/lib/siteAssets";
import { videos } from "@/lib/videos";
import VideoBackdrop from "@/components/VideoBackdrop";
import VideoGallery from "@/components/VideoGallery";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Videos | Photo Gallery",
  description: "Video coverage of temple festivals and events.",
};

export default function VideosPage() {
  return (
    <div>
      <section className="relative flex h-[46vh] min-h-[320px] items-center justify-center overflow-hidden px-4 text-center sm:px-6">
        <VideoBackdrop src={HERO_VIDEO_URL} />
        <Reveal className="relative z-10">
          <p className="font-display text-sm uppercase tracking-[0.35em] text-temple-gold">
            Sri Varasiththi Vinaayagar Hindu Temple
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Event <span className="italic text-shine">videos.</span>
          </h1>
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <VideoGallery videos={videos} />
      </div>
    </div>
  );
}
