export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-temple-surface text-foreground/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
