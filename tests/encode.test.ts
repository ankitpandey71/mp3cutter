import { describe, expect, it } from "vitest";
import { makeBuffer } from "./setup";
import { encodeWav, exportAudioBuffer } from "@/lib/audio/encode";

const readWav = async (blob: Blob) => {
  const view = new DataView(await blob.arrayBuffer());
  const str = (offset: number, len: number) =>
    String.fromCharCode(...Array.from({ length: len }, (_, i) => view.getUint8(offset + i)));
  return {
    view,
    riff: str(0, 4),
    wave: str(8, 4),
    fmt: str(12, 4),
    audioFormat: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    byteRate: view.getUint32(28, true),
    blockAlign: view.getUint16(32, true),
    bitsPerSample: view.getUint16(34, true),
    dataSize: view.getUint32(40, true),
  };
};

describe("encodeWav", () => {
  it("writes a valid 16-bit PCM header", async () => {
    const buffer = makeBuffer(2, 1000, 44100);
    const wav = await readWav(encodeWav(buffer));

    expect(wav.riff).toBe("RIFF");
    expect(wav.wave).toBe("WAVE");
    expect(wav.fmt).toBe("fmt ");
    expect(wav.audioFormat).toBe(1);
    expect(wav.channels).toBe(2);
    expect(wav.sampleRate).toBe(44100);
    expect(wav.bitsPerSample).toBe(16);
    expect(wav.blockAlign).toBe(4);
    expect(wav.byteRate).toBe(44100 * 4);
    expect(wav.dataSize).toBe(1000 * 4);
  });

  it("produces a blob of exactly 44 bytes of header plus the samples", async () => {
    const blob = encodeWav(makeBuffer(1, 500, 22050));
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + 500 * 2);
  });

  it("interleaves channels and clamps samples beyond full scale", async () => {
    const buffer = makeBuffer(2, 2, 44100, (i, c) => (c === 0 ? 4 : -4));
    const { view } = await readWav(encodeWav(buffer));

    expect(view.getInt16(44, true)).toBe(32767); // left, clamped to +1
    expect(view.getInt16(46, true)).toBe(-32768); // right, clamped to -1
  });

  it("round-trips a mid-scale sample within one quantisation step", async () => {
    const buffer = makeBuffer(1, 1, 44100, () => 0.5);
    const { view } = await readWav(encodeWav(buffer));
    expect(view.getInt16(44, true) / 0x7fff).toBeCloseTo(0.5, 4);
  });
});

describe("exportAudioBuffer", () => {
  it("routes wav through the lossless encoder and reports completion", async () => {
    const seen: number[] = [];
    const blob = await exportAudioBuffer(makeBuffer(1, 100), "wav", 192, (p) => seen.push(p));

    expect(blob.type).toBe("audio/wav");
    expect(seen.at(-1)).toBe(1);
  });

  it("produces an mpeg blob for mp3 and ends at full progress", async () => {
    const seen: number[] = [];
    const buffer = makeBuffer(2, 44100, 44100, (i) => Math.sin(i / 20) * 0.5);
    const blob = await exportAudioBuffer(buffer, "mp3", 128, (p) => seen.push(p));

    expect(blob.type).toBe("audio/mpeg");
    expect(blob.size).toBeGreaterThan(0);
    expect(seen.at(-1)).toBe(1);
  });
});
