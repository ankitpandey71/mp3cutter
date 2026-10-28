import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-zinc-100 bg-white py-10 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-base font-bold text-zinc-900 dark:text-white">
            Snip<span className="text-violet-600">Audio</span>
          </p>
          <p className="mt-2 max-w-xs">
            Free, private, browser-based MP3 cutter. No uploads, no watermarks,
            no signup — your audio never leaves your device.
          </p>
        </div>

        <div>
          <p className="mb-2 font-semibold text-zinc-800 dark:text-zinc-200">Site</p>
          <ul className="space-y-1.5">
            <li><Link href="/" className="hover:text-violet-600">MP3 Cutter</Link></li>
            <li><Link href="/about" className="hover:text-violet-600">About</Link></li>
            <li><Link href="/privacy" className="hover:text-violet-600">Privacy Policy</Link></li>
          </ul>
        </div>

        <div id="donate">
          <p className="mb-2 font-semibold text-zinc-800 dark:text-zinc-200">Support this project</p>
          <ul className="space-y-1.5">
            <li><Link href="/monetization" className="hover:text-violet-600">How we earn money</Link></li>
            <li><a href="https://www.buymeacoffee.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">☕ Buy me a coffee</a></li>
            <li><a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">💳 Donate via PayPal</a></li>
            <li><a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-600">🎁 Ko‑fi tip jar</a></li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} SnipAudio. All processing happens locally in your browser.
      </p>
    </footer>
  );
};

export default Footer;
