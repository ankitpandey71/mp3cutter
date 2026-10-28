import { formatBytes, formatTime } from "@/lib/utils/formatTime";

interface FileInfoCardProps {
  file: File;
  buffer: AudioBuffer | null;
  onReset: () => void;
}

const FileInfoCard = ({ file, buffer, onReset }: FileInfoCardProps) => {
  return (
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
          {buffer && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>{formatTime(buffer.duration)}</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>{(buffer.sampleRate / 1000).toFixed(1)} kHz</span>
            </>
          )}
        </p>
      </div>
      <button
        onClick={onReset}
        className="shrink-0 rounded-xl border border-zinc-900/10 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 dark:border-white/10 dark:text-zinc-300 dark:hover:text-red-400"
      >
        Change file
      </button>
    </div>
  );
};

export default FileInfoCard;
