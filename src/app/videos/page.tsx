import type { Metadata } from "next";
import { HERO_VIDEO_URL } from "@/lib/siteAssets";
import VideoBackdrop from "@/components/VideoBackdrop";
import ComingSoonText from "@/components/ComingSoonText";

export const metadata: Metadata = {
  title: "Videos | Photo Gallery",
  description: "Video coverage of temple festivals and events — coming soon.",
};

export default function VideosPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-73px)] items-center overflow-hidden px-4 text-center sm:px-6">
      <VideoBackdrop src={HERO_VIDEO_URL} />
      <ComingSoonText />
    </div>
  );
}
