import { formatBytes } from "@/lib/utils/formatTime";

let sharedContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!sharedContext) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedContext = new Ctor();
  }
  return sharedContext;
};

/**
 * Decoding expands to 32-bit floats per channel, so a file this size already
 * costs roughly 1 GB of RAM once decoded. Past it the tab tends to be killed
 * outright, which looks like a silent failure — better to refuse up front.
 */
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** Thrown for problems we can explain to the visitor, rather than a decoder fault. */
export class AudioFileError extends Error {}

/** Prefers our own explanation over a generic decoder failure message. */
export const decodeErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof AudioFileError ? error.message : fallback;

export const decodeAudioFile = async (file: File): Promise<AudioBuffer> => {
  if (file.size === 0) {
    throw new AudioFileError("That file is empty.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new AudioFileError(
      `That file is ${formatBytes(file.size)}. Files over ${formatBytes(
        MAX_AUDIO_BYTES
      )} can't be decoded in the browser — trim it first or use a smaller export.`
    );
  }
  const arrayBuffer = await file.arrayBuffer();
  const ctx = getAudioContext();
  // Safari leaves the context suspended until a gesture resumes it
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  return ctx.decodeAudioData(arrayBuffer.slice(0));
};

/** Returns a new AudioBuffer containing only the [startSec, endSec) slice. */
export const sliceAudioBuffer = (
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer => {
  const ctx = getAudioContext();
  const { sampleRate } = buffer;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(endSec * sampleRate));
  const frameCount = Math.max(0, endSample - startSample);

  const sliced = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const sourceData = buffer.getChannelData(channel);
    const slicedData = sliced.getChannelData(channel);
    slicedData.set(sourceData.subarray(startSample, endSample));
  }

  return sliced;
};

export const getFadedBuffer = (
  buffer: AudioBuffer,
  fadeInSec: number,
  fadeOutSec: number
): AudioBuffer => {
  if (fadeInSec <= 0 && fadeOutSec <= 0) return buffer;
  const ctx = getAudioContext();
  const { sampleRate } = buffer;
  const result = ctx.createBuffer(buffer.numberOfChannels, buffer.length, sampleRate);
  const fadeInSamples = Math.min(buffer.length, Math.floor(fadeInSec * sampleRate));
  const fadeOutSamples = Math.min(buffer.length, Math.floor(fadeOutSec * sampleRate));

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const src = buffer.getChannelData(channel);
    const dst = result.getChannelData(channel);
    dst.set(src);
    for (let i = 0; i < fadeInSamples; i++) {
      dst[i] *= i / fadeInSamples;
    }
    for (let i = 0; i < fadeOutSamples; i++) {
      const idx = dst.length - 1 - i;
      dst[idx] *= i / fadeOutSamples;
    }
  }
  return result;
};

/**
 * Concatenates buffers end to end with optional silence between them.
 * All buffers are decoded by the shared AudioContext, so they share its sample rate;
 * mono inputs are copied to every output channel.
 */
export const concatAudioBuffers = (buffers: AudioBuffer[], gapSec = 0): AudioBuffer => {
  const ctx = getAudioContext();
  const { sampleRate } = buffers[0];
  const numChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const gapSamples = Math.floor(gapSec * sampleRate);
  const totalLength =
    buffers.reduce((sum, b) => sum + b.length, 0) + gapSamples * (buffers.length - 1);

  const result = ctx.createBuffer(numChannels, totalLength, sampleRate);

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < numChannels; channel++) {
      const source = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      result.getChannelData(channel).set(source, offset);
    }
    offset += buffer.length + gapSamples;
  }

  return result;
};
