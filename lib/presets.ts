/**
 * One-tap clip lengths for the places people actually publish audio.
 * Durations are the platform's hard ceiling for the common upload path, so a
 * clip cut here never gets rejected or silently truncated on the other side.
 */
export interface ClipPreset {
  id: string;
  label: string;
  /** Target clip length in seconds */
  seconds: number;
  /** Shown in the chip's tooltip */
  hint: string;
}

export const clipPresets: ClipPreset[] = [
  { id: "tiktok-15", label: "TikTok 15s", seconds: 15, hint: "Classic TikTok sound length" },
  { id: "tiktok-30", label: "TikTok 30s", seconds: 30, hint: "Longer TikTok / Reels audio" },
  { id: "reels-90", label: "Reels 90s", seconds: 90, hint: "Maximum Instagram Reels length" },
  { id: "shorts-60", label: "Shorts 60s", seconds: 60, hint: "Maximum YouTube Shorts length" },
  { id: "status-30", label: "Status 30s", seconds: 30, hint: "WhatsApp / Instagram Story audio" },
  { id: "ringtone-30", label: "Ringtone 30s", seconds: 30, hint: "Fits iPhone and Android ringtones" },
];

export interface Range {
  start: number;
  end: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Resizes a selection to `seconds`, holding the start still where possible and
 * sliding it earlier only when the clip would overrun the end of the track.
 * A preset longer than the track selects the whole thing rather than failing.
 */
export const applyPresetLength = (
  range: Range,
  seconds: number,
  duration: number
): Range => {
  if (!Number.isFinite(duration) || duration <= 0) return range;
  const length = Math.min(seconds, duration);
  const start = clamp(range.start, 0, duration - length);
  return { start, end: start + length };
};

/** True when the selection already matches the preset, within a frame or so. */
export const isPresetActive = (
  range: Range,
  seconds: number,
  duration: number
): boolean => {
  const target = Math.min(seconds, duration);
  return Math.abs(range.end - range.start - target) < 0.02;
};

/**
 * Keeps an edited bound legal: inside the track, correctly ordered, no shorter
 * than `minLength`, and no longer than `maxLength` when a tool caps it.
 */
export const setBound = (
  range: Range,
  side: "start" | "end",
  value: number,
  duration: number,
  options: { minLength?: number; maxLength?: number } = {}
): Range => {
  const minLength = options.minLength ?? 0.05;
  const maxLength = options.maxLength ?? duration;

  if (side === "start") {
    const start = clamp(value, 0, Math.max(0, range.end - minLength));
    // Pull the end in if the new start leaves the clip over a tool's limit
    const end = Math.min(range.end, start + maxLength);
    return { start, end };
  }

  const end = clamp(value, Math.min(range.start + minLength, duration), duration);
  const start = Math.max(range.start, end - maxLength);
  return { start, end };
};

/** Resizes from the start, so typing a length behaves like dragging the end handle. */
export const setLength = (
  range: Range,
  length: number,
  duration: number,
  options: { minLength?: number; maxLength?: number } = {}
): Range =>
  setBound(range, "end", range.start + length, duration, options);
