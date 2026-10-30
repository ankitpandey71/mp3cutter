"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FileDropzone from "./FileDropzone";
import WaveformEditor from "./WaveformEditor";
import ExportPanel from "./ExportPanel";
import FileInfoCard from "./FileInfoCard";
import AdSlot from "@/components/ads/AdSlot";
import {
  decodeAudioFile,
  decodeErrorMessage,
  getFadedBuffer,
  sliceAudioBuffer,
} from "@/lib/audio/decode";
import { exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import { baseName, downloadBlob } from "@/lib/utils/download";

export interface CutterPreset {
  /** Initial selection length in seconds (defaults to the whole file) */
  selectionLength?: number;
  /** Longest selection the user can drag to, in seconds */
  maxSelection?: number;
  fadeIn?: number;
  fadeOut?: number;
  /** Appended to the downloaded file name, e.g. "ringtone" → song-ringtone.mp3 */
  fileSuffix?: string;
}

interface MP3CutterProps {
  preset?: CutterPreset;
}

const MP3Cutter = ({ preset = {} }: MP3CutterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [playbackKey, setPlaybackKey] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  const handleFileSelected = useCallback(async (selected: File) => {
    setError(null);
    setIsDecoding(true);
    try {
      const decoded = await decodeAudioFile(selected);
      setAudioBuffer(decoded);
      setFile(selected);
    } catch (err) {
      setError(
        decodeErrorMessage(
          err,
          "We couldn't read that audio file. Try a different file or format (MP3, WAV, OGG, M4A)."
        )
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

        downloadBlob(blob, `${baseName(file.name)}-${preset.fileSuffix ?? "cut"}.${format}`);
      } catch {
        setError("Something went wrong while exporting. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [audioBuffer, file, preset.fileSuffix]
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
        <FileDropzone onFilesSelected={(files) => handleFileSelected(files[0])} isLoading={isDecoding} />
        {errorBanner}
        <AdSlot slot="cutter-empty-state" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <FileInfoCard file={file} buffer={audioBuffer} onReset={handleReset} />

        <WaveformEditor
          file={file}
          onRegionChange={(start, end) => setRange({ start, end })}
          onDurationReady={(dur) => setRange({ start: 0, end: dur })}
          onRestart={() => setPlaybackKey((k) => k + 1)}
          selectionLength={preset.selectionLength}
          maxSelection={preset.maxSelection}
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
            defaultFadeIn={preset.fadeIn}
            defaultFadeOut={preset.fadeOut}
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
