import Link from "next/link";
import NavLinks from "./NavLinks";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
      <div className="glass-card mx-auto flex max-w-6xl items-center justify-between rounded-2xl! px-3 py-2.5 sm:px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
              <path d="M4 12h2M8 8v8M12 5v14M16 9v6M20 12h0" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Snip<span className="text-gradient">Audio</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLinks />
          <a
            href="#donate"
            className="btn-primary ml-1 hidden px-4 py-2 text-sm sm:inline-flex"
          >
            Support us
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
