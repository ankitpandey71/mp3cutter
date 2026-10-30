"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_AUDIO_BYTES } from "@/lib/audio/decode";
import { formatBytes } from "@/lib/utils/formatTime";

export type MediaKind = "audio" | "video";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  isLoading?: boolean;
  kind?: MediaKind;
}

const MEDIA = {
  audio: {
    pattern: /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i,
    mimePrefix: "audio/",
    accept: "audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac",
    formats: ["MP3", "WAV", "OGG", "M4A", "AAC", "FLAC"],
    noun: "audio",
  },
  video: {
    pattern: /\.(mp4|m4v|mov|webm|mkv)$/i,
    mimePrefix: "video/",
    accept: "video/*,.mp4,.m4v,.mov,.webm,.mkv",
    formats: ["MP4", "MOV", "WEBM", "MKV", "M4V"],
    noun: "video",
  },
};

// Decorative equalizer bar heights
const BARS = [40, 70, 55, 90, 65, 100, 75, 50, 85, 60, 95, 45, 70, 55, 80];

const FileDropzone = ({
  onFilesSelected,
  multiple = false,
  isLoading = false,
  kind = "audio",
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const media = MEDIA[kind];

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const picked = multiple ? Array.from(files) : [files[0]];
      const rightType = picked.filter(
        (file) => file.type.startsWith(media.mimePrefix) || media.pattern.test(file.name)
      );
      const accepted = rightType.filter((file) => file.size <= MAX_AUDIO_BYTES);

      // Report the first problem that applies, rather than stacking messages
      if (rightType.length < picked.length) {
        setRejection(
          `Please choose ${media.noun} files only (${media.formats.join(", ")}).`
        );
      } else if (accepted.length < rightType.length) {
        setRejection(
          `Files over ${formatBytes(MAX_AUDIO_BYTES)} can't be decoded in the browser.`
        );
      } else {
        setRejection(null);
      }

      if (accepted.length > 0) onFilesSelected(accepted);
    },
    [onFilesSelected, multiple, media]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`glass-card group flex w-full cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem]! p-10 text-center outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-16 ${
        isDragging ? "scale-[1.01] ring-2 ring-violet-500" : "hover:-translate-y-0.5"
      }`}
    >
      {/* Gradient border glow on hover / drag */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[2rem] bg-linear-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 transition-opacity duration-300 ${
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />

      <input
        ref={inputRef}
        type="file"
        accept={media.accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div aria-hidden className="relative flex h-16 items-end gap-1">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full bg-linear-to-t from-violet-600 to-fuchsia-400 ${
              isLoading || isDragging ? "animate-eq" : "opacity-70 group-hover:animate-eq"
            }`}
            style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="relative">
        <p className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {isLoading ? `Decoding your ${media.noun}…` : isDragging ? "Release to load" : `Drop your ${media.noun} ${multiple ? "files" : "file"} here`}
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          or{" "}
          <span className="font-medium text-violet-600 underline-offset-4 group-hover:underline dark:text-violet-400">
            browse your device
          </span>
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-1.5">
        {media.formats.map((f) => (
          <span
            key={f}
            className="rounded-md border border-zinc-900/10 bg-white/60 px-2 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
          >
            {f}
          </span>
        ))}
      </div>

      {rejection && (
        <p
          role="alert"
          className="relative rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300"
        >
          {rejection}
        </p>
      )}

      <p className="relative flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        Processed locally — never uploaded to a server
      </p>
    </div>
  );
};

export default FileDropzone;
