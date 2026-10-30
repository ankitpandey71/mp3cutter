import { describe, expect, it } from "vitest";
import { makeBuffer } from "./setup";
import {
  AudioFileError,
  MAX_AUDIO_BYTES,
  concatAudioBuffers,
  decodeAudioFile,
  decodeErrorMessage,
  getFadedBuffer,
  sliceAudioBuffer,
} from "@/lib/audio/decode";

const RATE = 1000;

describe("sliceAudioBuffer", () => {
  it("keeps only the requested window and preserves the samples", () => {
    const source = makeBuffer(2, RATE, RATE, (i) => i / RATE);
    const clip = sliceAudioBuffer(source, 0.25, 0.75);

    expect(clip.length).toBe(500);
    expect(clip.numberOfChannels).toBe(2);
    expect(clip.getChannelData(0)[0]).toBeCloseTo(0.25, 5);
    expect(clip.getChannelData(1)[499]).toBeCloseTo(0.749, 5);
  });

  it("clamps a range that runs past either end", () => {
    const source = makeBuffer(1, RATE, RATE, () => 0.5);
    expect(sliceAudioBuffer(source, -5, 99).length).toBe(RATE);
  });

  it("returns an empty buffer when the range is inverted", () => {
    const source = makeBuffer(1, RATE, RATE);
    expect(sliceAudioBuffer(source, 0.8, 0.2).length).toBe(0);
  });
});

describe("getFadedBuffer", () => {
  it("returns the input untouched when both fades are zero", () => {
    const source = makeBuffer(1, 100, RATE, () => 1);
    expect(getFadedBuffer(source, 0, 0)).toBe(source);
  });

  it("ramps in from silence and out to near silence", () => {
    const source = makeBuffer(1, RATE, RATE, () => 1);
    const faded = getFadedBuffer(source, 0.1, 0.1).getChannelData(0);

    expect(faded[0]).toBe(0);
    expect(faded[50]).toBeCloseTo(0.5, 5);
    expect(faded[RATE - 1]).toBe(0);
    expect(faded[500]).toBe(1); // untouched middle
  });

  it("never reads outside the buffer when a fade exceeds its length", () => {
    const source = makeBuffer(1, 10, RATE, () => 1);
    const faded = getFadedBuffer(source, 5, 5).getChannelData(0);
    expect(faded.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe("concatAudioBuffers", () => {
  it("joins buffers end to end", () => {
    const a = makeBuffer(1, 100, RATE, () => 0.25);
    const b = makeBuffer(1, 150, RATE, () => 0.75);
    const joined = concatAudioBuffers([a, b]);

    expect(joined.length).toBe(250);
    expect(joined.getChannelData(0)[99]).toBeCloseTo(0.25, 5);
    expect(joined.getChannelData(0)[100]).toBeCloseTo(0.75, 5);
  });

  it("inserts silence of the requested length between tracks", () => {
    const a = makeBuffer(1, 100, RATE, () => 1);
    const b = makeBuffer(1, 100, RATE, () => 1);
    const joined = concatAudioBuffers([a, b], 0.5);

    expect(joined.length).toBe(700);
    expect(joined.getChannelData(0)[300]).toBe(0);
    expect(joined.getChannelData(0)[600]).toBe(1);
  });

  it("widens a mono track to match a stereo one", () => {
    const mono = makeBuffer(1, 50, RATE, () => 0.4);
    const stereo = makeBuffer(2, 50, RATE, () => 0.6);
    const joined = concatAudioBuffers([mono, stereo]);

    expect(joined.numberOfChannels).toBe(2);
    expect(joined.getChannelData(1)[0]).toBeCloseTo(0.4, 5);
  });
});

describe("decodeAudioFile guards", () => {
  const fakeFile = (size: number): File =>
    ({ size, name: "track.mp3", arrayBuffer: async () => new ArrayBuffer(size) }) as File;

  it("rejects an empty file", async () => {
    await expect(decodeAudioFile(fakeFile(0))).rejects.toBeInstanceOf(AudioFileError);
  });

  it("rejects a file past the decode ceiling", async () => {
    await expect(decodeAudioFile(fakeFile(MAX_AUDIO_BYTES + 1))).rejects.toThrow(
      /can't be decoded/
    );
  });
});

describe("decodeErrorMessage", () => {
  it("surfaces our own explanation", () => {
    expect(decodeErrorMessage(new AudioFileError("too big"), "generic")).toBe("too big");
  });

  it("falls back for any other failure", () => {
    expect(decodeErrorMessage(new TypeError("boom"), "generic")).toBe("generic");
    expect(decodeErrorMessage("boom", "generic")).toBe("generic");
  });
});
