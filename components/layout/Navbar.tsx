import Link from "next/link";

const links = [
  { href: "/", label: "Cutter" },
  { href: "/about", label: "About" },
  { href: "/monetization", label: "Support Us" },
];

const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth={1.8} />
              <circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth={1.8} />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Snip<span className="text-violet-600">Audio</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="#donate"
            className="ml-1 hidden rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:block"
          >
            ☕ Buy us a coffee
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
