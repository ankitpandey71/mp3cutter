import { Mp3Encoder } from "@breezystack/lamejs";

const floatTo16BitPCM = (input: Float32Array): Int16Array => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
};

export type ExportFormat = "mp3" | "wav";

export type EncodeProgress = (fraction: number) => void;

/** Encodes an AudioBuffer to an MP3 Blob using lamejs, chunked to avoid blocking the UI too long. */
export const encodeMp3 = async (
  buffer: AudioBuffer,
  bitrateKbps: number = 192,
  onProgress?: EncodeProgress
): Promise<Blob> => {
  const channels = Math.min(2, buffer.numberOfChannels);
  const { sampleRate } = buffer;
  const encoder = new Mp3Encoder(channels, sampleRate, bitrateKbps);

  const left = floatTo16BitPCM(buffer.getChannelData(0));
  const right = channels === 2 ? floatTo16BitPCM(buffer.getChannelData(1)) : undefined;

  const blockSize = 1152;
  const chunks: Uint8Array[] = [];
  const totalBlocks = Math.ceil(left.length / blockSize);

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right ? right.subarray(i, i + blockSize) : undefined;
    const mp3buf = right
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
    if (mp3buf.length > 0) chunks.push(mp3buf);

    if (onProgress && i % (blockSize * 200) === 0) {
      onProgress(Math.min(0.99, i / blockSize / totalBlocks));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const end = encoder.flush();
  if (end.length > 0) chunks.push(end);
  onProgress?.(1);

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
};

/** Encodes an AudioBuffer to a WAV Blob (uncompressed, lossless). */
export const encodeWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const { sampleRate } = buffer;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
};

export const exportAudioBuffer = async (
  buffer: AudioBuffer,
  format: ExportFormat,
  bitrateKbps: number,
  onProgress?: EncodeProgress
): Promise<Blob> => {
  if (format === "wav") {
    onProgress?.(1);
    return encodeWav(buffer);
  }
  return encodeMp3(buffer, bitrateKbps, onProgress);
};
