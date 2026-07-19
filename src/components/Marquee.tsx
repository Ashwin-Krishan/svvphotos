export default function Marquee({ items }: { items: string[] }) {
  // Duplicated once so the track can loop seamlessly at -50% translate.
  const track = [...items, ...items];

  return (
    <div className="scrollbar-none overflow-hidden border-y border-white/10 bg-temple-surface py-3">
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 text-sm font-medium uppercase tracking-[0.2em] text-foreground/50"
          >
            {item}
            <span className="text-temple-gold">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
