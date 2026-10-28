"use client";

import { useState } from "react";
import type { ExportFormat } from "@/lib/audio/encode";
import { formatTime } from "@/lib/utils/formatTime";

interface ExportPanelProps {
  start: number;
  end: number;
  fileName: string;
  isExporting: boolean;
  progress: number;
  onExport: (format: ExportFormat, bitrate: number, fadeIn: number, fadeOut: number) => void;
}

const BITRATES = [128, 192, 256, 320];

const ExportPanel = ({
  start,
  end,
  fileName,
  isExporting,
  progress,
  onExport,
}: ExportPanelProps) => {
  const [format, setFormat] = useState<ExportFormat>("mp3");
  const [bitrate, setBitrate] = useState(192);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);

  const duration = Math.max(0, end - start);

  return (
    <div className="w-full rounded-2xl border border-violet-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
        Export settings
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Selected clip: <span className="font-mono">{formatTime(duration)}</span> from{" "}
        <span className="truncate font-medium">{fileName}</span>
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Format
          </label>
          <div className="flex gap-2">
            {(["mp3", "wav"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold uppercase transition ${
                  format === f
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-violet-300 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={format === "wav" ? "opacity-40" : ""}>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Bitrate
          </label>
          <div className="flex gap-2">
            {BITRATES.map((b) => (
              <button
                key={b}
                disabled={format === "wav"}
                onClick={() => setBitrate(b)}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  bitrate === b
                    ? "border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Fade in <span className="font-mono normal-case">{fadeIn.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min={0}
            max={Math.min(5, duration / 2)}
            step={0.1}
            value={fadeIn}
            onChange={(e) => setFadeIn(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
        </div>

        <div>
          <label className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Fade out <span className="font-mono normal-case">{fadeOut.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min={0}
            max={Math.min(5, duration / 2)}
            step={0.1}
            value={fadeOut}
            onChange={(e) => setFadeOut(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
        </div>
      </div>

      <button
        disabled={isExporting || duration <= 0}
        onClick={() => onExport(format, bitrate, fadeIn, fadeOut)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Processing… {Math.round(progress * 100)}%
          </>
        ) : (
          <>Cut &amp; Download {format.toUpperCase()}</>
        )}
      </button>

      {isExporting && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
