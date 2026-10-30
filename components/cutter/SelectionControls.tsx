"use client";

import TimeInput from "./TimeInput";
import { formatTime } from "@/lib/utils/formatTime";
import {
  applyPresetLength,
  clipPresets,
  isPresetActive,
  setBound,
  setLength,
  type Range,
} from "@/lib/presets";

interface SelectionControlsProps {
  range: Range;
  duration: number;
  onChange: (range: Range) => void;
  /** Longest clip the tool allows, e.g. a ringtone cap */
  maxSelection?: number;
}

/**
 * Exact selection editing: one-tap platform lengths plus typed start/end/length.
 * Every edit goes through the pure helpers in lib/presets, so the selection can
 * never end up inverted, out of bounds, or past a tool's maximum length.
 */
const SelectionControls = ({
  range,
  duration,
  onChange,
  maxSelection,
}: SelectionControlsProps) => {
  const limits = { maxLength: maxSelection ?? duration };
  const length = Math.max(0, range.end - range.start);
  const presets = clipPresets.filter(
    (preset) => !maxSelection || preset.seconds <= maxSelection
  );

  return (
    <div className="glass-card w-full p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Selection</h2>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          of {formatTime(duration)}
        </span>
      </div>

      {/* Horizontal scroll keeps every preset reachable on a narrow phone */}
      <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
        <div className="flex w-max gap-2">
          {presets.map((preset) => {
            const active = isPresetActive(range, preset.seconds, duration);
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.hint}
                aria-pressed={active}
                onClick={() => onChange(applyPresetLength(range, preset.seconds, duration))}
                className={`h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${
                  active
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300"
                    : "border-zinc-900/10 bg-white/60 text-zinc-600 hover:border-violet-500/30 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-violet-300"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <TimeInput
          label="Start"
          value={range.start}
          onChange={(value) => onChange(setBound(range, "start", value, duration, limits))}
        />
        <TimeInput
          label="End"
          value={range.end}
          onChange={(value) => onChange(setBound(range, "end", value, duration, limits))}
        />
        <div className="col-span-2 sm:col-span-1">
          <TimeInput
            label="Length"
            value={length}
            onChange={(value) => onChange(setLength(range, value, duration, limits))}
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
        Type an exact time, or use{" "}
        <kbd className="rounded border border-zinc-900/10 bg-white/60 px-1 font-mono dark:border-white/10 dark:bg-white/5">
          ↑
        </kbd>{" "}
        <kbd className="rounded border border-zinc-900/10 bg-white/60 px-1 font-mono dark:border-white/10 dark:bg-white/5">
          ↓
        </kbd>{" "}
        — hold Shift for 1s, Alt for 10ms.
      </p>
    </div>
  );
};

export default SelectionControls;
