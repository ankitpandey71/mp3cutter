"use client";

import { useCallback, useRef, useState } from "react";
import FileDropzone from "./FileDropzone";
import WaveformEditor from "./WaveformEditor";
import ExportPanel from "./ExportPanel";
import AdSlot from "@/components/ads/AdSlot";
import {
  decodeAudioFile,
  getFadedBuffer,
  sliceAudioBuffer,
} from "@/lib/audio/decode";
import { exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import { formatBytes, formatTime } from "@/lib/utils/formatTime";

const baseName = (name: string): string => name.replace(/\.[^/.]+$/, "");

const MP3Cutter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [playbackKey, setPlaybackKey] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const handleFileSelected = useCallback(async (selected: File) => {
    setError(null);
    setIsDecoding(true);
    try {
      const decoded = await decodeAudioFile(selected);
      setAudioBuffer(decoded);
      setFile(selected);
    } catch {
      setError(
        "We couldn't read that audio file. Try a different file or format (MP3, WAV, OGG, M4A)."
      );
    } finally {
      setIsDecoding(false);
    }
  }, []);

  const handleReset = (): void => {
    setFile(null);
    setAudioBuffer(null);
    setRange({ start: 0, end: 0 });
    setError(null);
  };

  const handleExport = useCallback(
    async (format: ExportFormat, bitrate: number, fadeIn: number, fadeOut: number) => {
      if (!audioBuffer || !file) return;
      setIsExporting(true);
      setProgress(0);
      try {
        const { start, end } = rangeRef.current;
        let clip = sliceAudioBuffer(audioBuffer, start, end);
        clip = getFadedBuffer(clip, fadeIn, fadeOut);

        const blob = await exportAudioBuffer(clip, format, bitrate, (p) =>
          setProgress(p)
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName(file.name)}-cut.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("Something went wrong while exporting. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [audioBuffer, file]
  );

  const errorBanner = error && (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-0.5 h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
      {error}
    </div>
  );

  if (!file) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FileDropzone onFileSelected={handleFileSelected} isLoading={isDecoding} />
        {errorBanner}
        <AdSlot slot="cutter-empty-state" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <div className="glass-card flex items-center gap-4 rounded-2xl! p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {file.name}
            </p>
            <p className="mt-0.5 flex gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <span>{formatBytes(file.size)}</span>
              {audioBuffer && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{formatTime(audioBuffer.duration)}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{(audioBuffer.sampleRate / 1000).toFixed(1)} kHz</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 rounded-xl border border-zinc-900/10 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 dark:border-white/10 dark:text-zinc-300 dark:hover:text-red-400"
          >
            Change file
          </button>
        </div>

        <WaveformEditor
          file={file}
          onRegionChange={(start, end) => setRange({ start, end })}
          onDurationReady={(dur) => setRange({ start: 0, end: dur })}
          onRestart={() => setPlaybackKey((k) => k + 1)}
          playbackKey={playbackKey}
        />

        {audioBuffer && (
          <ExportPanel
            start={range.start}
            end={range.end}
            fileName={file.name}
            isExporting={isExporting}
            progress={progress}
            onExport={handleExport}
          />
        )}

        {errorBanner}
      </div>

      <aside className="flex flex-col gap-4">
        <AdSlot slot="cutter-sidebar" orientation="vertical" />
      </aside>
    </div>
  );
};

export default MP3Cutter;
