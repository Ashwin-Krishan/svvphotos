/**
 * Full-bleed autoplaying YouTube background. Browsers only allow
 * unprompted autoplay when muted, so this is always mute=1 + loop=1 —
 * there's no way around that from our side, it's a browser policy.
 * playsinline=1 gets it to autoplay inline (not fullscreen) on iOS.
 *
 * The oversized-iframe-in-a-clipped-box trick below (rather than
 * object-fit, which iframes don't support) keeps the video covering the
 * hero at any viewport aspect ratio, the same way background-size:cover
 * would for an <img>.
 */
export default function VideoBackdrop({ youtubeId }: { youtubeId: string }) {
  const src =
    `https://www.youtube-nocookie.com/embed/${youtubeId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${youtubeId}` +
    `&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`;

  return (
    <div className="absolute inset-0 overflow-hidden bg-temple-surface">
      <div className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2">
        <iframe
          src={src}
          title="Temple background video"
          allow="autoplay; encrypted-media"
          className="h-full w-full pointer-events-none"
          frameBorder={0}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      <div className="kolam-grid absolute inset-0 opacity-40" />
    </div>
  );
}
