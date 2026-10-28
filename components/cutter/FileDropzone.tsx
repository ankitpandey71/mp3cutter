"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
}

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/webm",
];

const FileDropzone = ({ onFileSelected }: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAcceptable = (file: File) =>
    ACCEPTED_TYPES.includes(file.type) || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isAcceptable(file)) {
        alert("Please choose an audio file (MP3, WAV, OGG, M4A, AAC, FLAC).");
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
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
      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 text-center transition-colors sm:p-20 ${
        isDragging
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
          : "border-zinc-300 bg-white hover:border-violet-400 hover:bg-violet-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Drop your audio file here
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          or click to browse — MP3, WAV, OGG, M4A, AAC, FLAC supported
        </p>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        100% private — your file is processed locally and never uploaded to a server.
      </p>
    </div>
  );
};

export default FileDropzone;
