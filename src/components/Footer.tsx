export default function Footer() {
  return (
    <footer className="kolam-grid border-t border-white/10 bg-temple-surface text-foreground/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="font-display text-2xl italic text-temple-gold/90">
          Let love bind us all together.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Sri Varasiththi Vinaayagar Hindu
            Temple of Toronto
          </p>
          <p>
            For services, hours, and donations, visit{" "}
            <a
              href="https://www.vinaayagar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-temple-gold underline underline-offset-2 hover:text-temple-gold-dark"
            >
              vinaayagar.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
