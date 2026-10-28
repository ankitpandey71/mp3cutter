"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/plugins/regions";
import { formatTime } from "@/lib/utils/formatTime";

interface InsertPointPickerProps {
  file: File;
  position: number;
  onPositionChange: (seconds: number) => void;
}

const NUDGES = [-5, -1, -0.1, 0.1, 1, 5];

const InsertPointPicker = ({ file, position, onPositionChange }: InsertPointPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const markerRef = useRef<Region | null>(null);
  const onChangeRef = useRef(onPositionChange);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    onChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const objectUrl = URL.createObjectURL(file);
    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: ["#c4b5fd", "#a78bfa", "#c4b5fd"],
      progressColor: ["#8b5cf6", "#c026d3", "#8b5cf6"],
      cursorColor: "#a78bfa",
      cursorWidth: 1,
      height: 120,
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
      const start = Math.min(dur / 2, dur);
      markerRef.current = regions.addRegion({
        start,
        color: "#e879f9",
        drag: true,
        content: "Insert here",
      });
      onChangeRef.current(start);
    });

    // Clicking anywhere on the waveform moves the insert point there
    ws.on("interaction", (time) => {
      markerRef.current?.setOptions({ start: time });
      onChangeRef.current(time);
    });
    regions.on("region-updated", (region) => onChangeRef.current(region.start));
    ws.on("timeupdate", setCurrentTime);
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    return () => {
      ws.destroy();
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const setPosition = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(duration, seconds));
      markerRef.current?.setOptions({ start: clamped });
      waveSurferRef.current?.setTime(clamped);
      onPositionChange(clamped);
    },
    [duration, onPositionChange]
  );

  /** Plays the 3 seconds leading up to the insert point so the user can hear the cut. */
  const playLeadIn = (): void => {
    const ws = waveSurferRef.current;
    if (!ws) return;
    if (ws.isPlaying()) {
      ws.pause();
      return;
    }
    void ws.play(Math.max(0, position - 3), position);
  };

  const togglePlay = (): void => {
    void waveSurferRef.current?.playPause();
  };

  return (
    <div className="glass-card w-full overflow-hidden p-0!">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/5 px-5 py-3 dark:border-white/5">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Click the waveform or drag the pink marker to choose where the audio goes
        </p>
        <p className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>

      <div className="bg-linear-to-b from-violet-500/[0.04] to-transparent px-3 py-5 sm:px-5">
        <div ref={containerRef} className="waveform w-full" />
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-zinc-900/5 px-5 py-4 dark:border-white/5">
        <div className="text-center">
          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Insert point
          </div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">
            {formatTime(position)}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {NUDGES.map((delta) => (
            <button
              key={delta}
              onClick={() => setPosition(position + delta)}
              className="rounded-lg border border-zinc-900/10 px-2.5 py-1.5 font-mono text-xs text-zinc-600 transition hover:border-violet-500/40 hover:text-violet-700 dark:border-white/10 dark:text-zinc-300 dark:hover:text-violet-300"
            >
              {delta > 0 ? "+" : "−"}
              {Math.abs(delta)}s
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={playLeadIn}
            className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/10 dark:text-violet-300"
          >
            {isPlaying ? "Stop" : "▶ Hear 3s before the point"}
          </button>
          <button
            onClick={togglePlay}
            className="rounded-xl border border-zinc-900/10 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-900/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            {isPlaying ? "Pause" : "Play song"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertPointPicker;
