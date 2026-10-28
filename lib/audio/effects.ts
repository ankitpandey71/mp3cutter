import { getAudioContext } from "./decode";

export type EffectProgress = (fraction: number) => void;

const yieldToUi = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const createLike = (source: AudioBuffer, length: number, channels = source.numberOfChannels): AudioBuffer =>
  getAudioContext().createBuffer(channels, Math.max(1, length), source.sampleRate);

/** Mono mix used for analysis (silence detection, WSOLA alignment). */
const mixToMono = (buffer: AudioBuffer): Float32Array => {
  const mono = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }
  return mono;
};

export const reverseBuffer = (buffer: AudioBuffer): AudioBuffer => {
  const result = createLike(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const out = result.getChannelData(ch);
    out.set(buffer.getChannelData(ch));
    out.reverse();
  }
  return result;
};

export const getPeak = (buffer: AudioBuffer): number => {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  return peak;
};

/** Soft-knee limiter: transparent below the threshold, smoothly saturates towards 1.0 above it. */
const softLimit = (x: number, threshold = 0.9): number => {
  const abs = Math.abs(x);
  if (abs <= threshold) return x;
  const headroom = 1 - threshold;
  return Math.sign(x) * (threshold + headroom * Math.tanh((abs - threshold) / headroom));
};

export const applyGain = (
  buffer: AudioBuffer,
  gainDb: number,
  { normalize = false, limit = true }: { normalize?: boolean; limit?: boolean } = {}
): AudioBuffer => {
  let gain = Math.pow(10, gainDb / 20);
  if (normalize) {
    const peak = getPeak(buffer);
    if (peak > 0) gain = 0.98 / peak;
  }
  const result = createLike(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = result.getChannelData(ch);
    for (let i = 0; i < src.length; i++) {
      const v = src[i] * gain;
      dst[i] = limit ? softLimit(v) : Math.max(-1, Math.min(1, v));
    }
  }
  return result;
};

/** Linear-interpolation resample; rate > 1 plays faster (shorter, higher pitch). */
export const resampleBuffer = (buffer: AudioBuffer, rate: number): AudioBuffer => {
  const length = Math.floor(buffer.length / rate);
  const result = createLike(buffer, length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = result.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const pos = i * rate;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const a = src[idx] ?? 0;
      const b = src[idx + 1] ?? a;
      dst[i] = a + (b - a) * frac;
    }
  }
  return result;
};

/**
 * WSOLA time-stretch: changes duration without changing pitch.
 * rate > 1 → faster/shorter. Alignment is searched on a decimated mono mix
 * and the same offsets are applied to every channel so stereo stays coherent.
 */
export const timeStretch = async (
  buffer: AudioBuffer,
  rate: number,
  onProgress?: EffectProgress
): Promise<AudioBuffer> => {
  if (Math.abs(rate - 1) < 1e-3) return buffer;

  const { sampleRate } = buffer;
  const frameSize = Math.pow(2, Math.round(Math.log2(sampleRate * 0.046)));
  const synthesisHop = frameSize / 2;
  const analysisHop = synthesisHop * rate;
  const tolerance = Math.floor(frameSize / 4);
  const lagStep = 2;
  const sampleStep = 8;

  const mono = mixToMono(buffer);
  const outLength = Math.floor(buffer.length / rate);
  const frameCount = Math.ceil(outLength / synthesisHop) + 1;

  const window = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frameSize);

  const channels = Array.from({ length: buffer.numberOfChannels }, (_, ch) => buffer.getChannelData(ch));
  const output = channels.map(() => new Float32Array(outLength + frameSize));
  const norm = new Float32Array(outLength + frameSize);

  let prevPos = 0;
  for (let k = 0; k < frameCount; k++) {
    const nominal = Math.round(k * analysisHop);
    let bestPos = nominal;

    if (k > 0) {
      // Find the input frame that best continues the previously copied frame
      const natural = prevPos + synthesisHop;
      let bestScore = -Infinity;
      for (let lag = -tolerance; lag <= tolerance; lag += lagStep) {
        const candidate = nominal + lag;
        if (candidate < 0 || candidate + synthesisHop >= mono.length) continue;
        let score = 0;
        for (let i = 0; i < synthesisHop; i += sampleStep) {
          score += (mono[natural + i] ?? 0) * mono[candidate + i];
        }
        if (score > bestScore) {
          bestScore = score;
          bestPos = candidate;
        }
      }
    }

    const outPos = k * synthesisHop;
    for (let i = 0; i < frameSize; i++) {
      const srcIdx = bestPos + i;
      if (srcIdx >= buffer.length || outPos + i >= norm.length) break;
      const w = window[i];
      for (let ch = 0; ch < channels.length; ch++) output[ch][outPos + i] += channels[ch][srcIdx] * w;
      norm[outPos + i] += w;
    }
    prevPos = bestPos;

    if (k % 64 === 0) {
      onProgress?.(k / frameCount);
      await yieldToUi();
    }
  }

  const result = createLike(buffer, outLength);
  for (let ch = 0; ch < channels.length; ch++) {
    const dst = result.getChannelData(ch);
    for (let i = 0; i < outLength; i++) dst[i] = norm[i] > 1e-3 ? output[ch][i] / norm[i] : output[ch][i];
  }
  onProgress?.(1);
  return result;
};

export const changeSpeed = async (
  buffer: AudioBuffer,
  speed: number,
  keepPitch: boolean,
  onProgress?: EffectProgress
): Promise<AudioBuffer> =>
  keepPitch ? timeStretch(buffer, speed, onProgress) : resampleBuffer(buffer, speed);

/** Shifts pitch by semitones while keeping the original duration. */
export const shiftPitch = async (
  buffer: AudioBuffer,
  semitones: number,
  onProgress?: EffectProgress
): Promise<AudioBuffer> => {
  if (semitones === 0) return buffer;
  const factor = Math.pow(2, semitones / 12);
  const stretched = await timeStretch(buffer, 1 / factor, onProgress);
  return resampleBuffer(stretched, factor);
};

/**
 * Removes stretches quieter than thresholdDb lasting at least minSilenceSec,
 * keeping paddingSec of each pause and crossfading the joins to avoid clicks.
 */
export const removeSilence = (
  buffer: AudioBuffer,
  thresholdDb: number,
  minSilenceSec: number,
  paddingSec = 0.1
): AudioBuffer => {
  const { sampleRate } = buffer;
  const windowSize = Math.floor(sampleRate * 0.01);
  const threshold = Math.pow(10, thresholdDb / 20);
  const mono = mixToMono(buffer);
  const windowCount = Math.ceil(mono.length / windowSize);

  const silent = new Uint8Array(windowCount);
  for (let w = 0; w < windowCount; w++) {
    let sum = 0;
    const start = w * windowSize;
    const end = Math.min(mono.length, start + windowSize);
    for (let i = start; i < end; i++) sum += mono[i] * mono[i];
    silent[w] = Math.sqrt(sum / Math.max(1, end - start)) < threshold ? 1 : 0;
  }

  const minWindows = Math.ceil((minSilenceSec * sampleRate) / windowSize);
  const padSamples = Math.floor(paddingSec * sampleRate);
  // Sample ranges to keep
  const keep: [number, number][] = [];
  let cursor = 0;
  let w = 0;
  while (w < windowCount) {
    if (!silent[w]) {
      w++;
      continue;
    }
    let runEnd = w;
    while (runEnd < windowCount && silent[runEnd]) runEnd++;
    if (runEnd - w >= minWindows) {
      const cutStart = Math.min(mono.length, w * windowSize + padSamples);
      const cutEnd = Math.max(cutStart, Math.min(mono.length, runEnd * windowSize) - padSamples);
      if (cutStart > cursor) keep.push([cursor, cutStart]);
      cursor = cutEnd;
    }
    w = runEnd;
  }
  if (cursor < mono.length) keep.push([cursor, mono.length]);
  if (keep.length === 0) return buffer;

  const total = keep.reduce((sum, [a, b]) => sum + (b - a), 0);
  const result = createLike(buffer, total);
  const fade = Math.floor(sampleRate * 0.005);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = result.getChannelData(ch);
    let offset = 0;
    keep.forEach(([a, b], idx) => {
      dst.set(src.subarray(a, b), offset);
      const len = b - a;
      const f = Math.min(fade, Math.floor(len / 2));
      for (let i = 0; i < f; i++) {
        if (idx > 0) dst[offset + i] *= i / f;
        if (idx < keep.length - 1) dst[offset + len - 1 - i] *= i / f;
      }
      offset += len;
    });
  }
  return result;
};
