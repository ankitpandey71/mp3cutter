"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import FileDropzone from "@/components/cutter/FileDropzone";
import ExportPanel from "@/components/cutter/ExportPanel";
import AdSlot from "@/components/ads/AdSlot";
import { concatAudioBuffers, decodeAudioFile, getFadedBuffer } from "@/lib/audio/decode";
import { exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import { formatBytes, formatTime } from "@/lib/utils/formatTime";
import { baseName, downloadBlob } from "@/lib/utils/download";

interface Track {
  id: string;
  file: File;
  buffer: AudioBuffer;
}

const MAX_GAP = 5;

const AudioJoiner = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [gap, setGap] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setError(null);
    setIsDecoding(true);
    const decoded: Track[] = [];
    const failed: string[] = [];
    for (const file of files) {
      try {
        const buffer = await decodeAudioFile(file);
        decoded.push({ id: crypto.randomUUID(), file, buffer });
      } catch {
        failed.push(file.name);
      }
    }
    setTracks((prev) => [...prev, ...decoded]);
    if (failed.length > 0) {
      setError(`We couldn't read ${failed.join(", ")}. Try a different file or format.`);
    }
    setIsDecoding(false);
  }, []);

  const moveTrack = (index: number, direction: -1 | 1): void => {
    setTracks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeTrack = (id: string): void => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const totalDuration =
    tracks.reduce((sum, t) => sum + t.buffer.duration, 0) + gap * Math.max(0, tracks.length - 1);

  const handleExport = useCallback(
    async (format: ExportFormat, bitrate: number, fadeIn: number, fadeOut: number) => {
      if (tracks.length < 2) return;
      setIsExporting(true);
      setProgress(0);
      setError(null);
      try {
        const merged = getFadedBuffer(
          concatAudioBuffers(tracks.map((t) => t.buffer), gap),
          fadeIn,
          fadeOut
        );
        const blob = await exportAudioBuffer(merged, format, bitrate, setProgress);
        downloadBlob(blob, `${baseName(tracks[0].file.name)}-joined.${format}`);
      } catch {
        setError("Something went wrong while joining. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [tracks, gap]
  );

  const errorBanner = error && (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {error}
    </div>
  );

  if (tracks.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FileDropzone multiple onFilesSelected={handleFilesSelected} isLoading={isDecoding} />
        {errorBanner}
        <AdSlot slot="joiner-empty-state" />
      </div>
    );
  }

  const iconButton =
    "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900/5 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <div className="glass-card overflow-hidden p-0!">
          <div className="flex items-center justify-between border-b border-zinc-900/5 px-5 py-3 dark:border-white/5">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              <span className="ml-2 font-mono text-xs font-normal text-zinc-500 dark:text-zinc-400">
                {formatTime(totalDuration)} total
              </span>
            </p>
            <button
              onClick={() => addInputRef.current?.click()}
              disabled={isDecoding}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-900/10 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-violet-500/40 hover:text-violet-700 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:text-violet-300"
            >
              {isDecoding ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
              Add files
            </button>
            <input
              ref={addInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </div>

          <ol className="divide-y divide-zinc-900/5 dark:divide-white/5">
            {tracks.map((track, i) => (
              <li key={track.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{track.file.name}</p>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTime(track.buffer.duration)} · {formatBytes(track.file.size)}
                  </p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => moveTrack(i, -1)} disabled={i === 0} className={iconButton} aria-label={`Move ${track.file.name} up`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button onClick={() => moveTrack(i, 1)} disabled={i === tracks.length - 1} className={iconButton} aria-label={`Move ${track.file.name} down`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className={`${iconButton} hover:bg-red-500/10! hover:text-red-600!`}
                    aria-label={`Remove ${track.file.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <label className="block border-t border-zinc-900/5 bg-violet-500/[0.03] px-5 py-4 dark:border-white/5">
            <span className="mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Gap between tracks
              <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">{gap.toFixed(1)}s</span>
            </span>
            <input
              type="range"
              min={0}
              max={MAX_GAP}
              step={0.1}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="range-premium w-full"
              style={{ "--fill": `${(gap / MAX_GAP) * 100}%` } as CSSProperties}
            />
          </label>
        </div>

        {tracks.length < 2 ? (
          <p className="glass-card rounded-2xl! px-5 py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Add at least one more file to join.
          </p>
        ) : (
          <ExportPanel
            start={0}
            end={totalDuration}
            fileName={`${tracks.length} tracks merged in order`}
            isExporting={isExporting}
            progress={progress}
            onExport={handleExport}
            actionLabel="Join & Download"
          />
        )}

        {errorBanner}
      </div>

      <aside className="flex flex-col gap-4">
        <AdSlot slot="joiner-sidebar" orientation="vertical" />
      </aside>
    </div>
  );
};

export default AudioJoiner;
