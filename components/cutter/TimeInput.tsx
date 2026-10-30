"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrecise, parseTime } from "@/lib/utils/formatTime";

interface TimeInputProps {
  label: string;
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
  /** Step for the −/+ buttons, in seconds */
  step?: number;
}

/**
 * A millisecond-accurate time field.
 *
 * Typing is held in a draft so a half-finished value never reaches the editor,
 * and only committed on blur or Enter. The field renders `mm:ss.mmm` but also
 * accepts plain seconds ("4.25"), which is what the decimal keypad on a phone
 * can actually produce — there is no colon on that keyboard.
 */
const TimeInput = ({ label, value, onChange, disabled = false, step = 0.1 }: TimeInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drop a stale draft if the value moves underneath us (drag, preset, reset)
  useEffect(() => {
    if (draft !== null && document.activeElement !== inputRef.current) {
      setDraft(null);
      setInvalid(false);
    }
  }, [value, draft]);

  const commit = (text: string): void => {
    const parsed = parseTime(text);
    if (parsed === null) {
      setInvalid(true);
      setDraft(null);
      return;
    }
    setInvalid(false);
    setDraft(null);
    onChange(parsed);
  };

  const nudge = (delta: number): void => {
    setDraft(null);
    setInvalid(false);
    onChange(Math.max(0, value + delta));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(e.currentTarget.value);
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(null);
      setInvalid(false);
      e.currentTarget.blur();
      return;
    }
    // Alt for a single frame, Shift for a whole second, plain for the normal step
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const size = e.altKey ? 0.01 : e.shiftKey ? 1 : step;
      nudge(e.key === "ArrowUp" ? size : -size);
    }
  };

  const buttonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center text-lg font-medium text-zinc-500 transition hover:bg-zinc-900/5 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white";

  return (
    <div className="min-w-0">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div
        className={`flex items-center overflow-hidden rounded-xl border bg-white/60 transition dark:bg-white/5 ${
          invalid
            ? "border-red-500/50"
            : "border-zinc-900/10 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-white/10"
        }`}
      >
        <button
          type="button"
          onClick={() => nudge(-step)}
          disabled={disabled || value <= 0}
          className={`${buttonClass} border-r border-zinc-900/10 dark:border-white/10`}
          aria-label={`${label} back ${step} seconds`}
        >
          −
        </button>

        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={draft ?? formatPrecise(value)}
          aria-label={`${label} time`}
          aria-invalid={invalid}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onBlur={(e) => (draft === null ? undefined : commit(e.target.value))}
          onKeyDown={handleKeyDown}
          className="h-11 w-full min-w-0 bg-transparent text-center font-mono text-sm font-semibold tabular-nums text-zinc-900 outline-none disabled:opacity-40 dark:text-white"
        />

        <button
          type="button"
          onClick={() => nudge(step)}
          disabled={disabled}
          className={`${buttonClass} border-l border-zinc-900/10 dark:border-white/10`}
          aria-label={`${label} forward ${step} seconds`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TimeInput;
