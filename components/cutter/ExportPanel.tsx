"use client";

import { useState, type CSSProperties } from "react";
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
  const maxFade = Math.min(5, duration / 2);
  const fillOf = (value: number): CSSProperties =>
    ({ "--fill": `${maxFade > 0 ? (value / maxFade) * 100 : 0}%` }) as CSSProperties;
  const labelClass =
    "mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

  return (
    <div className="glass-card w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Export settings
          </h2>
          <p className="mt-1 max-w-xs truncate text-sm text-zinc-500 dark:text-zinc-400 sm:max-w-sm">
            {fileName}
          </p>
        </div>
        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-xs font-medium text-violet-700 dark:text-violet-300">
          {formatTime(duration)} clip
        </span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Format</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
            {(["mp3", "wav"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                aria-pressed={format === f}
                className={`rounded-lg px-4 py-2 text-sm font-semibold uppercase transition ${
                  format === f
                    ? "bg-white text-violet-700 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={`transition-opacity ${format === "wav" ? "opacity-40" : ""}`}>
          <span className={labelClass}>
            Bitrate <span className="font-mono normal-case tracking-normal">kbps</span>
          </span>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
            {BITRATES.map((b) => (
              <button
                key={b}
                disabled={format === "wav"}
                onClick={() => setBitrate(b)}
                aria-pressed={bitrate === b}
                className={`rounded-lg px-1 py-2 font-mono text-xs font-semibold transition disabled:cursor-not-allowed ${
                  bitrate === b
                    ? "bg-white text-violet-700 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className={labelClass}>
            Fade in <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">{fadeIn.toFixed(1)}s</span>
          </span>
          <input
            type="range"
            min={0}
            max={maxFade}
            step={0.1}
            value={fadeIn}
            onChange={(e) => setFadeIn(Number(e.target.value))}
            className="range-premium w-full"
            style={fillOf(fadeIn)}
          />
        </label>

        <label className="block">
          <span className={labelClass}>
            Fade out <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">{fadeOut.toFixed(1)}s</span>
          </span>
          <input
            type="range"
            min={0}
            max={maxFade}
            step={0.1}
            value={fadeOut}
            onChange={(e) => setFadeOut(Number(e.target.value))}
            className="range-premium w-full"
            style={fillOf(fadeOut)}
          />
        </label>
      </div>

      <button
        disabled={isExporting || duration <= 0}
        onClick={() => onExport(format, bitrate, fadeIn, fadeOut)}
        className="btn-primary mt-7 w-full overflow-hidden px-6 py-4 text-base"
      >
        {isExporting && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-white/15 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        )}
        <span className="relative flex items-center gap-2">
          {isExporting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Processing… {Math.round(progress * 100)}%
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Cut &amp; Download {format.toUpperCase()}
            </>
          )}
        </span>
      </button>
    </div>
  );
};

export default ExportPanel;
