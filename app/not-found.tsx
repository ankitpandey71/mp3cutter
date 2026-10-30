import Link from "next/link";
import { tools } from "@/lib/tools";

export const metadata = {
  title: "Page not found",
  description: "That page doesn't exist. Browse the free audio tools instead.",
  robots: { index: false, follow: true },
};

const NotFound = () => (
  <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
    <span className="font-mono text-6xl font-bold tracking-tighter text-violet-500/30">
      404
    </span>
    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
      We couldn&apos;t find that page
    </h1>
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      The link may be outdated. Every tool below runs free in your browser.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-2">
      {tools.slice(0, 6).map((tool) => (
        <Link
          key={tool.path}
          href={tool.path}
          className="rounded-full border border-zinc-900/10 bg-white/60 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-violet-500/40 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-violet-300"
        >
          {tool.name}
        </Link>
      ))}
    </div>
    <Link href="/tools" className="btn-primary px-6 py-3 text-sm">
      See all tools
    </Link>
  </section>
);

export default NotFound;
