/**
 * Full-bleed autoplaying background video, hosted in R2 (same
 * zero-egress storage already serving the photos) rather than embedded
 * from YouTube — no title-bar/branding flash, no iframe overhead, and
 * proper object-fit: cover instead of the oversized-iframe-in-a-box
 * trick iframes need. Browsers only allow unprompted autoplay when
 * muted, so that's non-negotiable regardless of hosting — a browser
 * policy, not a YouTube one. playsInline keeps it inline (not
 * fullscreen) on iOS.
 */
export default function VideoBackdrop({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-temple-surface">
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      <div className="kolam-grid absolute inset-0 opacity-40" />
    </div>
  );
}
