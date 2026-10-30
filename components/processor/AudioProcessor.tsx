"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import FileDropzone from "@/components/cutter/FileDropzone";
import ExportPanel from "@/components/cutter/ExportPanel";
import FileInfoCard from "@/components/cutter/FileInfoCard";
import AdSlot from "@/components/ads/AdSlot";
import { decodeAudioFile, decodeErrorMessage, getFadedBuffer } from "@/lib/audio/decode";
import { encodeWav, exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import { baseName, downloadBlob } from "@/lib/utils/download";
import { defaultSettings, effectConfigs, type EffectId, type EffectSettings } from "./effects";

interface AudioProcessorProps {
  effect: EffectId;
  /** Skip the dropzone and start with this file (used by the voice recorder) */
  initialFile?: File;
  onReset?: () => void;
}

interface ProcessedResult {
  key: string;
  buffer: AudioBuffer;
}

const AudioProcessor = ({ effect, initialFile, onReset }: AudioProcessorProps) => {
  const config = effectConfigs[effect];
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [settings, setSettings] = useState<EffectSettings>(() => defaultSettings(config));
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; summary?: string } | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<ProcessedResult | null>(null);
  const urlsRef = useRef<string[]>([]);

  const trackUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    return url;
  };

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const handleFile = useCallback(async (selected: File) => {
    setError(null);
    setIsDecoding(true);
    try {
      const decoded = await decodeAudioFile(selected);
      setBuffer(decoded);
      setFile(selected);
      setOriginalUrl(trackUrl(selected));
    } catch (err) {
      setError(
        decodeErrorMessage(
          err,
          config.kind === "video"
            ? "We couldn't read the audio track from that video. Try an MP4 or WEBM file — very large videos may also run out of memory."
            : "We couldn't read that audio file. Try a different file or format (MP3, WAV, OGG, M4A)."
        )
      );
    } finally {
      setIsDecoding(false);
    }
  }, [config.kind]);

  const initialFileHandled = useRef(false);
  useEffect(() => {
    if (initialFile && !initialFileHandled.current) {
      initialFileHandled.current = true;
      void handleFile(initialFile);
    }
  }, [initialFile, handleFile]);

  const handleReset = (): void => {
    setFile(null);
    setBuffer(null);
    setPreview(null);
    setOriginalUrl(null);
    setError(null);
    cacheRef.current = null;
    onReset?.();
  };

  const updateSetting = (key: string, value: number | boolean): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
  };

  /** Runs the effect, reusing the last result when settings haven't changed. */
  const getProcessed = async (onProgress?: (p: number) => void): Promise<AudioBuffer> => {
    if (!buffer) throw new Error("No audio loaded");
    if (!config.process) return buffer;
    const key = JSON.stringify(settings);
    if (cacheRef.current?.key === key) return cacheRef.current.buffer;
    const result = await config.process(buffer, settings, onProgress);
    cacheRef.current = { key, buffer: result };
    return result;
  };

  const handlePreview = async (): Promise<void> => {
    if (!buffer) return;
    setIsPreviewing(true);
    setError(null);
    try {
      const processed = await getProcessed();
      setPreview({
        url: trackUrl(encodeWav(processed)),
        summary: config.describe?.(buffer, processed),
      });
    } catch {
      setError("Something went wrong while processing. Please try again.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExport = async (
    format: ExportFormat,
    bitrate: number,
    fadeIn: number,
    fadeOut: number
  ): Promise<void> => {
    if (!file || !buffer) return;
    setIsExporting(true);
    setProgress(0);
    setError(null);
    // Heavy effects get the first half of the progress bar, encoding the rest
    const split = config.process ? 0.5 : 0;
    try {
      const processed = await getProcessed((p) => setProgress(p * split));
      const faded = getFadedBuffer(processed, fadeIn, fadeOut);
      const blob = await exportAudioBuffer(faded, format, bitrate, (p) =>
        setProgress(split + p * (1 - split))
      );
      downloadBlob(blob, `${baseName(file.name)}-${config.fileSuffix}.${format}`);
    } catch {
      setError("Something went wrong while exporting. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const errorBanner = error && (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {error}
    </div>
  );

  if (!file || !buffer) {
    if (initialFile) {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <p className="glass-card p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {isDecoding ? "Preparing your recording…" : "Couldn't load the recording."}
          </p>
          {errorBanner}
        </div>
      );
    }
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FileDropzone
          kind={config.kind}
          onFilesSelected={(files) => handleFile(files[0])}
          isLoading={isDecoding}
        />
        {errorBanner}
        <AdSlot slot={`${effect}-empty-state`} />
      </div>
    );
  }

  const labelClass =
    "mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <FileInfoCard file={file} buffer={buffer} onReset={handleReset} />

        <div className="glass-card flex flex-col gap-5 p-6">
          {config.controls.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {config.controls.map((control) => {
                if (control.type === "toggle") {
                  const checked = settings[control.key] as boolean;
                  return (
                    <label key={control.key} className="flex cursor-pointer items-start gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        onClick={() => updateSetting(control.key, !checked)}
                        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                          checked ? "bg-linear-to-r from-violet-500 to-fuchsia-500" : "bg-zinc-900/10 dark:bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            checked ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                      <span>
                        <span className="block text-sm font-medium text-zinc-900 dark:text-white">{control.label}</span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{control.hint}</span>
                      </span>
                    </label>
                  );
                }
                const value = settings[control.key] as number;
                const disabled = control.disabledBy ? Boolean(settings[control.disabledBy]) : false;
                const fill = ((value - control.min) / (control.max - control.min)) * 100;
                return (
                  <label key={control.key} className={`block transition-opacity ${disabled ? "opacity-40" : ""}`}>
                    <span className={labelClass}>
                      {control.label}
                      <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">
                        {control.format(value)}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={value}
                      disabled={disabled}
                      onChange={(e) => updateSetting(control.key, Number(e.target.value))}
                      className="range-premium w-full"
                      style={{ "--fill": `${fill}%` } as CSSProperties}
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Original</span>
              {originalUrl && <audio controls src={originalUrl} className="w-full" />}
            </div>
            {config.process && (
              <div>
                <span className={labelClass}>Result</span>
                {preview ? (
                  <audio controls autoPlay src={preview.url} className="w-full" />
                ) : (
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewing}
                    className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/10 disabled:opacity-60 dark:text-violet-300"
                  >
                    {isPreviewing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Preview result
                      </>
                    )}
                  </button>
                )}
                {preview?.summary && (
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">{preview.summary}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <ExportPanel
          start={0}
          end={buffer.duration}
          fileName={file.name}
          isExporting={isExporting}
          progress={progress}
          onExport={handleExport}
          actionLabel={config.actionLabel}
          showFades={Boolean(config.fades)}
          fadeLimit={config.fades?.limit}
          defaultFadeIn={config.fades?.fadeIn}
          defaultFadeOut={config.fades?.fadeOut}
        />

        {errorBanner}
      </div>

      <aside className="flex flex-col gap-4">
        <AdSlot slot={`${effect}-sidebar`} orientation="vertical" />
      </aside>
    </div>
  );
};

export default AudioProcessor;
