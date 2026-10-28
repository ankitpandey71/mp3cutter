"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/plugins/regions";
import { formatTime } from "@/lib/utils/formatTime";

interface WaveformEditorProps {
  file: File;
  onRegionChange: (start: number, end: number) => void;
  onDurationReady: (duration: number) => void;
  onReady?: () => void;
  playbackKey: number;
}

const WaveformEditor = ({
  file,
  onRegionChange,
  onDurationReady,
  onReady,
  playbackKey,
}: WaveformEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const activeRegionRef = useRef<Region | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(file);
    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a78bfa",
      progressColor: "#7c3aed",
      cursorColor: "#4c1d95",
      cursorWidth: 2,
      height: 128,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
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
        end: dur,
        color: "rgba(124, 58, 237, 0.15)",
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

  const handleZoom = (value: number): void => {
    setZoom(value);
    waveSurferRef.current?.zoom(value);
  };

  const region = activeRegionRef.current;

  return (
    <div className="w-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div ref={containerRef} className="w-full" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4 font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Zoom</span>
          <input
            type="range"
            min={0}
            max={200}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-violet-600"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play selection"}
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
      </div>

      {region && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-violet-50 p-3 text-center text-sm dark:bg-zinc-800">
          <div>
            <div className="text-xs uppercase tracking-wide text-violet-400">Start</div>
            <div className="font-mono font-semibold text-violet-900 dark:text-violet-200">
              {formatTime(region.start)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-violet-400">End</div>
            <div className="font-mono font-semibold text-violet-900 dark:text-violet-200">
              {formatTime(region.end)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformEditor;
