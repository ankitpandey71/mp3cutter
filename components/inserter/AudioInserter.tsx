"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import FileDropzone from "@/components/cutter/FileDropzone";
import ExportPanel from "@/components/cutter/ExportPanel";
import FileInfoCard from "@/components/cutter/FileInfoCard";
import AdSlot from "@/components/ads/AdSlot";
import InsertPointPicker from "./InsertPointPicker";
import { decodeAudioFile, decodeErrorMessage, getFadedBuffer } from "@/lib/audio/decode";
import { encodeWav, exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import { insertAudio, type InsertMode } from "@/lib/audio/effects";
import { formatTime } from "@/lib/utils/formatTime";
import { baseName, downloadBlob } from "@/lib/utils/download";

interface LoadedAudio {
  file: File;
  buffer: AudioBuffer;
}

const MODES: { id: InsertMode; title: string; body: string }[] = [
  { id: "insert", title: "Insert", body: "Song pauses, your clip plays, then the song continues." },
  { id: "overlay", title: "Mix on top", body: "Clip plays over the song — great for voice-overs and effects." },
];

const AudioInserter = () => {
  const [song, setSong] = useState<LoadedAudio | null>(null);
  const [clip, setClip] = useState<LoadedAudio | null>(null);
  const [position, setPosition] = useState(0);
  const [mode, setMode] = useState<InsertMode>("insert");
  const [clipGainDb, setClipGainDb] = useState(0);
  const [duck, setDuck] = useState(true);
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(null);
  const [loading, setLoading] = useState<"song" | "clip" | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const clipInputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const load = async (file: File, target: "song" | "clip"): Promise<void> => {
    setError(null);
    setLoading(target);
    try {
      const loaded = { file, buffer: await decodeAudioFile(file) };
      if (target === "song") setSong(loaded);
      else setClip(loaded);
    } catch (err) {
      setError(
        decodeErrorMessage(
          err,
          `We couldn't read “${file.name}”. Try a different file or format (MP3, WAV, OGG, M4A).`
        )
      );
    } finally {
      setLoading(null);
    }
  };

  const fileKey = (a: LoadedAudio | null) => (a ? `${a.file.name}:${a.file.size}:${a.file.lastModified}` : "");
  // A preview is only shown while the inputs it was rendered from are unchanged
  const inputsKey = [fileKey(song), fileKey(clip), position, mode, clipGainDb, duck].join("|");
  const previewUrl = preview?.key === inputsKey ? preview.url : null;

  const render = (): AudioBuffer => {
    if (!song || !clip) throw new Error("Missing audio");
    return insertAudio(song.buffer, clip.buffer, position, {
      mode,
      clipGainDb,
      duckDb: mode === "overlay" && duck ? 10 : 0,
    });
  };

  const handlePreview = (): void => {
    setIsPreviewing(true);
    setError(null);
    // Let the spinner paint before the synchronous mix runs
    setTimeout(() => {
      try {
        const url = URL.createObjectURL(encodeWav(render()));
        urlsRef.current.push(url);
        setPreview({ url, key: inputsKey });
      } catch {
        setError("Something went wrong while mixing. Please try again.");
      } finally {
        setIsPreviewing(false);
      }
    }, 0);
  };

  const handleExport = async (
    format: ExportFormat,
    bitrate: number,
    fadeIn: number,
    fadeOut: number
  ): Promise<void> => {
    if (!song) return;
    setIsExporting(true);
    setProgress(0);
    setError(null);
    try {
      const mixed = getFadedBuffer(render(), fadeIn, fadeOut);
      const blob = await exportAudioBuffer(mixed, format, bitrate, setProgress);
      downloadBlob(blob, `${baseName(song.file.name)}-edited.${format}`);
    } catch {
      setError("Something went wrong while exporting. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const errorBanner = error && (
    <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {error}
    </div>
  );

  if (!song) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Step 1 of 2 — choose the main song
        </p>
        <FileDropzone onFilesSelected={(files) => load(files[0], "song")} isLoading={loading === "song"} />
        {errorBanner}
        <AdSlot slot="insert-audio-empty-state" />
      </div>
    );
  }

  const outputDuration =
    song.buffer.duration +
    (clip
      ? mode === "insert"
        ? clip.buffer.duration
        : Math.max(0, position + clip.buffer.duration - song.buffer.duration)
      : 0);
  const labelClass =
    "mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <FileInfoCard
          file={song.file}
          buffer={song.buffer}
          onReset={() => {
            setSong(null);
            setClip(null);
          }}
        />

        <InsertPointPicker file={song.file} position={position} onPositionChange={setPosition} />

        <div className="glass-card flex flex-col gap-6 p-6">
          <div>
            <span className={labelClass}>Audio to add</span>
            {clip ? (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-900/10 px-4 py-3 dark:border-white/10">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{clip.file.name}</p>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTime(clip.buffer.duration)}
                  </p>
                </div>
                <button
                  onClick={() => clipInputRef.current?.click()}
                  className="rounded-lg border border-zinc-900/10 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-violet-500/40 hover:text-violet-700 dark:border-white/10 dark:text-zinc-300"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                onClick={() => clipInputRef.current?.click()}
                disabled={loading === "clip"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-6 text-sm font-semibold text-violet-700 transition hover:border-violet-500/60 hover:bg-violet-500/10 disabled:opacity-60 dark:text-violet-300"
              >
                {loading === "clip" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
                Step 2 — choose the audio to add
              </button>
            )}
            <input
              ref={clipInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void load(file, "clip");
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <span className={labelClass}>How should it be added?</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={`rounded-xl border p-4 text-left transition ${
                    mode === m.id
                      ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500"
                      : "border-zinc-900/10 hover:border-violet-500/40 dark:border-white/10"
                  }`}
                >
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-white">{m.title}</span>
                  <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{m.body}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>
                Added audio volume
                <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">
                  {clipGainDb > 0 ? "+" : ""}
                  {clipGainDb.toFixed(1)} dB
                </span>
              </span>
              <input
                type="range"
                min={-20}
                max={10}
                step={0.5}
                value={clipGainDb}
                onChange={(e) => setClipGainDb(Number(e.target.value))}
                className="range-premium w-full"
                style={{ "--fill": `${((clipGainDb + 20) / 30) * 100}%` } as CSSProperties}
              />
            </label>

            {mode === "overlay" && (
              <label className="flex cursor-pointer items-start gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={duck}
                  onClick={() => setDuck((d) => !d)}
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                    duck ? "bg-linear-to-r from-violet-500 to-fuchsia-500" : "bg-zinc-900/10 dark:bg-white/10"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${duck ? "translate-x-5" : ""}`} />
                </button>
                <span>
                  <span className="block text-sm font-medium text-zinc-900 dark:text-white">Lower the song underneath</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Dips the music by 10 dB so the added audio is clear.</span>
                </span>
              </label>
            )}
          </div>

          {clip && (
            <div>
              <span className={labelClass}>
                Result preview
                <span className="font-mono normal-case tracking-normal">{formatTime(outputDuration)} total</span>
              </span>
              {previewUrl ? (
                <audio
                  controls
                  autoPlay
                  src={previewUrl}
                  className="w-full"
                  onLoadedMetadata={(e) => {
                    // Jump straight to just before the edit
                    e.currentTarget.currentTime = Math.max(0, position - 3);
                  }}
                />
              ) : (
                <button
                  onClick={handlePreview}
                  disabled={isPreviewing}
                  className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/10 disabled:opacity-60 dark:text-violet-300"
                >
                  {isPreviewing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                      Mixing…
                    </>
                  ) : (
                    "▶ Preview from 3s before the insert point"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {clip && (
          <ExportPanel
            start={0}
            end={outputDuration}
            fileName={`${song.file.name} + ${clip.file.name}`}
            isExporting={isExporting}
            progress={progress}
            onExport={handleExport}
            actionLabel="Add & Download"
          />
        )}

        {errorBanner}
      </div>

      <aside className="flex flex-col gap-4">
        <AdSlot slot="insert-audio-sidebar" orientation="vertical" />
      </aside>
    </div>
  );
};

export default AudioInserter;
