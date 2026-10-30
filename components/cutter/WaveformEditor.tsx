"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/plugins/regions";
import { formatTime } from "@/lib/utils/formatTime";

export interface WaveformEditorHandle {
  /** Moves the region from outside, e.g. a typed time or a preset chip */
  setRegion: (start: number, end: number) => void;
}

interface WaveformEditorProps {
  ref?: Ref<WaveformEditorHandle>;
  file: File;
  onRegionChange: (start: number, end: number) => void;
  onDurationReady: (duration: number) => void;
  onReady?: () => void;
  onRestart: () => void;
  playbackKey: number;
  selectionLength?: number;
  maxSelection?: number;
}

const WaveformEditor = ({
  ref,
  file,
  onRegionChange,
  onDurationReady,
  onReady,
  onRestart,
  playbackKey,
  selectionLength,
  maxSelection,
}: WaveformEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const activeRegionRef = useRef<Region | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(0);

  // The parent owns the selection, so expose a way to push one back down
  useImperativeHandle(
    ref,
    () => ({
      setRegion: (start, end) => {
        activeRegionRef.current?.setOptions({ start, end });
      },
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(file);
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: ["#c4b5fd", "#a78bfa", "#c4b5fd"],
      progressColor: ["#8b5cf6", "#c026d3", "#8b5cf6"],
      cursorColor: "#e879f9",
      cursorWidth: 2,
      height: 140,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      normalize: true,
      url: objectUrl,
      plugins: [regions],
    });
    waveSurferRef.current = ws;

    ws.on("ready", (dur) => {
      setDuration(dur);
      onDurationReady(dur);
      const region = regions.addRegion({
        start: 0,
        end: Math.min(dur, selectionLength ?? dur, maxSelection ?? dur),
        maxLength: maxSelection,
        color: "rgba(139, 92, 246, 0.12)",
        drag: true,
        resize: true,
      });
      activeRegionRef.current = region;
      onRegionChange(region.start, region.end);
      onReady?.();
    });

    ws.on("timeupdate", (t) => setCurrentTime(t));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    // Report both the live drag and its end, so the time fields track the handles
    regions.on("region-update", (region) => {
      onRegionChange(region.start, region.end);
    });

    regions.on("region-updated", (region) => {
      activeRegionRef.current = region;
      onRegionChange(region.start, region.end);
    });

    regions.on("region-clicked", (region, e) => {
      e.stopPropagation();
      region.play();
    });

    return () => {
      ws.destroy();
      URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    const region = activeRegionRef.current;
    const ws = waveSurferRef.current;
    if (!region || !ws) return;
    ws.setTime(region.start);
    region.play();
  }, [playbackKey]);

  const togglePlay = useCallback(() => {
    const ws = waveSurferRef.current;
    if (!ws) return;
    if (ws.isPlaying()) {
      ws.pause();
    } else {
      const region = activeRegionRef.current;
      if (region) {
        if (ws.getCurrentTime() < region.start || ws.getCurrentTime() >= region.end) {
          region.play();
        } else {
          ws.play();
        }
      } else {
        ws.play();
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, button, [contenteditable]")) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  const handleZoom = (value: number): void => {
    setZoom(value);
    waveSurferRef.current?.zoom(value);
  };

  return (
    <div className="glass-card w-full overflow-hidden p-0!">
      <div className="flex items-center justify-between border-b border-zinc-900/5 px-5 py-3 dark:border-white/5">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${isPlaying ? "animate-pulse bg-fuchsia-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
          {isPlaying ? "Playing selection" : "Drag the handles to select"}
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
          </svg>
          <span className="sr-only">Zoom</span>
          <input
            type="range"
            min={0}
            max={200}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="range-premium w-24 sm:w-32"
            style={{ "--fill": `${(zoom / 200) * 100}%` } as CSSProperties}
          />
        </label>
      </div>

      <div className="bg-linear-to-b from-violet-500/[0.04] to-transparent px-3 py-5 sm:px-5">
        <div ref={containerRef} className="waveform w-full" />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-zinc-900/5 px-5 py-4 dark:border-white/5">
        <div className="font-mono text-sm tabular-nums">
          <span className="text-zinc-900 dark:text-white">{formatTime(currentTime)}</span>
          <span className="text-zinc-400 dark:text-zinc-600"> / {formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRestart}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-900/10 text-zinc-600 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Restart selection from beginning"
            title="Restart selection"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="btn-primary h-14 w-14 rounded-full!"
            aria-label={isPlaying ? "Pause" : "Play selection"}
            title="Play / pause (Space)"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <span className="hidden h-10 w-10 sm:block" aria-hidden />
        </div>

        <p className="hidden text-right text-xs text-zinc-400 sm:block dark:text-zinc-500">
          <kbd className="rounded-md border border-zinc-900/10 bg-white/60 px-1.5 py-0.5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">Space</kbd>{" "}
          to play
        </p>
      </div>

    </div>
  );
};

export default WaveformEditor;
