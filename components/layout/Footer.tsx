import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-zinc-900/5 py-12 text-sm text-zinc-500 dark:border-white/5 dark:text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            Snip<span className="text-gradient">Audio</span>
          </p>
          <p className="mt-3 max-w-xs leading-relaxed">
            Free, private, browser-based MP3 cutter. No uploads, no watermarks,
            no signup — your audio never leaves your device.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            100% on-device processing
          </span>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Site</p>
          <ul className="space-y-2">
            <li><Link href="/" className="transition hover:text-violet-600 dark:hover:text-violet-400">MP3 Cutter</Link></li>
            <li><Link href="/about" className="transition hover:text-violet-600 dark:hover:text-violet-400">About</Link></li>
            <li><Link href="/privacy" className="transition hover:text-violet-600 dark:hover:text-violet-400">Privacy Policy</Link></li>
          </ul>
        </div>

        <div id="donate">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Support this project</p>
          <ul className="space-y-2">
            <li><Link href="/monetization" className="transition hover:text-violet-600 dark:hover:text-violet-400">How we earn money</Link></li>
            <li><a href="https://www.buymeacoffee.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-violet-600 dark:hover:text-violet-400">☕ Buy me a coffee</a></li>
            <li><a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-violet-600 dark:hover:text-violet-400">💳 Donate via PayPal</a></li>
            <li><a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-violet-600 dark:hover:text-violet-400">🎁 Ko‑fi tip jar</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-zinc-400 sm:px-6 dark:text-zinc-500">
        © {new Date().getFullYear()} SnipAudio. All processing happens locally in your browser.
      </p>
    </footer>
  );
};

export default Footer;
