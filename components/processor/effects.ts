import type { MediaKind } from "@/components/cutter/FileDropzone";
import {
  applyGain,
  changeSpeed,
  removeSilence,
  reverseBuffer,
  shiftPitch,
  type EffectProgress,
} from "@/lib/audio/effects";
import { formatTime } from "@/lib/utils/formatTime";

export type EffectId =
  | "convert"
  | "video-to-mp3"
  | "volume"
  | "speed"
  | "pitch"
  | "silence"
  | "fade"
  | "reverse";

export type EffectSettings = Record<string, number | boolean>;

interface SliderControl {
  type: "slider";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (value: number) => string;
  /** Key of a toggle that disables this slider while on */
  disabledBy?: string;
}

interface ToggleControl {
  type: "toggle";
  key: string;
  label: string;
  hint: string;
  defaultValue: boolean;
}

export type EffectControl = SliderControl | ToggleControl;

export interface EffectConfig {
  kind: MediaKind;
  controls: EffectControl[];
  /** Omitted for tools that only re-encode (converter, video to MP3, fades) */
  process?: (
    buffer: AudioBuffer,
    settings: EffectSettings,
    onProgress?: EffectProgress
  ) => AudioBuffer | Promise<AudioBuffer>;
  actionLabel: string;
  fileSuffix: string;
  fades?: { fadeIn: number; fadeOut: number; limit: number };
  /** One-line result summary shown under the preview */
  describe?: (input: AudioBuffer, output: AudioBuffer) => string;
}

const signed = (value: number, digits = 0): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;

export const effectConfigs: Record<EffectId, EffectConfig> = {
  convert: {
    kind: "audio",
    controls: [],
    actionLabel: "Convert & Download",
    fileSuffix: "converted",
  },
  "video-to-mp3": {
    kind: "video",
    controls: [],
    actionLabel: "Extract & Download",
    fileSuffix: "audio",
  },
  volume: {
    kind: "audio",
    controls: [
      {
        type: "slider",
        key: "gainDb",
        label: "Volume change",
        min: -12,
        max: 20,
        step: 0.5,
        defaultValue: 6,
        format: (v) => `${signed(v, 1)} dB (×${Math.pow(10, v / 20).toFixed(2)})`,
        disabledBy: "normalize",
      },
      {
        type: "toggle",
        key: "normalize",
        label: "Normalize instead",
        hint: "Raise the volume as far as possible without clipping.",
        defaultValue: false,
      },
    ],
    process: (buffer, s) => applyGain(buffer, s.gainDb as number, { normalize: s.normalize as boolean }),
    actionLabel: "Apply & Download",
    fileSuffix: "louder",
  },
  speed: {
    kind: "audio",
    controls: [
      {
        type: "slider",
        key: "speed",
        label: "Speed",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1.25,
        format: (v) => `${v.toFixed(2)}×`,
      },
      {
        type: "toggle",
        key: "keepPitch",
        label: "Keep original pitch",
        hint: "Off = tape-style speed change (faster also sounds higher).",
        defaultValue: true,
      },
    ],
    process: (buffer, s, onProgress) =>
      changeSpeed(buffer, s.speed as number, s.keepPitch as boolean, onProgress),
    actionLabel: "Apply & Download",
    fileSuffix: "speed",
    describe: (input, output) =>
      `Length ${formatTime(input.duration)} → ${formatTime(output.duration)}`,
  },
  pitch: {
    kind: "audio",
    controls: [
      {
        type: "slider",
        key: "semitones",
        label: "Pitch",
        min: -12,
        max: 12,
        step: 1,
        defaultValue: 2,
        format: (v) => `${signed(v)} semitone${Math.abs(v) === 1 ? "" : "s"}`,
      },
    ],
    process: (buffer, s, onProgress) => shiftPitch(buffer, s.semitones as number, onProgress),
    actionLabel: "Apply & Download",
    fileSuffix: "pitch",
  },
  silence: {
    kind: "audio",
    controls: [
      {
        type: "slider",
        key: "thresholdDb",
        label: "Silence threshold",
        min: -70,
        max: -20,
        step: 1,
        defaultValue: -45,
        format: (v) => `${v} dB`,
      },
      {
        type: "slider",
        key: "minSilence",
        label: "Remove pauses longer than",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 0.6,
        format: (v) => `${v.toFixed(1)}s`,
      },
      {
        type: "slider",
        key: "padding",
        label: "Keep around each cut",
        min: 0,
        max: 0.5,
        step: 0.05,
        defaultValue: 0.1,
        format: (v) => `${v.toFixed(2)}s`,
      },
    ],
    process: (buffer, s) =>
      removeSilence(buffer, s.thresholdDb as number, s.minSilence as number, s.padding as number),
    actionLabel: "Remove & Download",
    fileSuffix: "trimmed",
    describe: (input, output) => {
      const removed = Math.max(0, input.duration - output.duration);
      return removed < 0.05
        ? "No silence found at this threshold — try raising it."
        : `Removed ${removed.toFixed(1)}s of silence (${Math.round((removed / input.duration) * 100)}%)`;
    },
  },
  fade: {
    kind: "audio",
    controls: [],
    actionLabel: "Apply & Download",
    fileSuffix: "faded",
    fades: { fadeIn: 3, fadeOut: 3, limit: 20 },
  },
  reverse: {
    kind: "audio",
    controls: [],
    process: (buffer) => reverseBuffer(buffer),
    actionLabel: "Reverse & Download",
    fileSuffix: "reversed",
  },
};

export const defaultSettings = (config: EffectConfig): EffectSettings =>
  Object.fromEntries(config.controls.map((c) => [c.key, c.defaultValue]));
