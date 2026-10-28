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

  if (!file) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <FileDropzone onFileSelected={handleFileSelected} />
        {isDecoding && (
          <p className="mt-4 text-center text-sm text-zinc-500">Loading your audio…</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-500">{error}</p>
        )}
        <div className="mt-8">
          <AdSlot slot="cutter-empty-state" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {file.name}
            </p>
            <p className="text-xs text-zinc-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-red-300 hover:text-red-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            Choose another file
          </button>
        </div>

        <WaveformEditor
          file={file}
          onRegionChange={(start, end) => setRange({ start, end })}
          onDurationReady={(dur) => setRange({ start: 0, end: dur })}
          playbackKey={playbackKey}
        />

        <button
          onClick={() => setPlaybackKey((k) => k + 1)}
          className="self-center text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          ↺ Restart selection from beginning
        </button>

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

        {error && (
          <p className="text-center text-sm font-medium text-red-500">{error}</p>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <AdSlot slot="cutter-sidebar" orientation="vertical" />
      </aside>
    </div>
  );
};

export default MP3Cutter;
