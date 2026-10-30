"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches runtime crashes inside any route segment — most likely an audio
 * decode/encode failure in one of the client tools on an unsupported browser.
 */
const RouteError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-red-600 dark:text-red-400">
        Something broke
      </span>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        This tool hit an unexpected error
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Your audio never left this device, so nothing was lost. Try again, or reload
        the file — very large or unusual files can exhaust the browser&apos;s memory.
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
          Reference: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={() => retry()} className="btn-primary px-6 py-3 text-sm">
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-zinc-900/10 px-6 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-900/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          Back to the cutter
        </Link>
      </div>
    </section>
  );
};

export default RouteError;
