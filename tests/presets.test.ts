import { describe, expect, it } from "vitest";
import {
  applyPresetLength,
  clipPresets,
  isPresetActive,
  setBound,
  setLength,
} from "@/lib/presets";

const DURATION = 200;

describe("clipPresets", () => {
  it("has unique ids and labels", () => {
    expect(new Set(clipPresets.map((p) => p.id)).size).toBe(clipPresets.length);
    expect(new Set(clipPresets.map((p) => p.label)).size).toBe(clipPresets.length);
  });

  it("describes every preset with a positive length", () => {
    for (const preset of clipPresets) {
      expect(preset.seconds, preset.id).toBeGreaterThan(0);
      expect(preset.hint.length, preset.id).toBeGreaterThan(10);
    }
  });
});

describe("applyPresetLength", () => {
  it("holds the start still and moves the end", () => {
    expect(applyPresetLength({ start: 10, end: 80 }, 15, DURATION)).toEqual({
      start: 10,
      end: 25,
    });
  });

  it("slides the start back when the clip would overrun the track", () => {
    expect(applyPresetLength({ start: 195, end: 200 }, 30, DURATION)).toEqual({
      start: 170,
      end: 200,
    });
  });

  it("selects the whole track when the preset is longer than it", () => {
    expect(applyPresetLength({ start: 2, end: 5 }, 90, 20)).toEqual({ start: 0, end: 20 });
  });

  it("leaves the range alone when the duration isn't known yet", () => {
    const range = { start: 0, end: 0 };
    expect(applyPresetLength(range, 15, 0)).toBe(range);
    expect(applyPresetLength(range, 15, NaN)).toBe(range);
  });
});

describe("isPresetActive", () => {
  it("matches a selection of the preset length", () => {
    expect(isPresetActive({ start: 10, end: 25 }, 15, DURATION)).toBe(true);
    expect(isPresetActive({ start: 10, end: 25.5 }, 15, DURATION)).toBe(false);
  });

  it("matches a short track that a long preset fully selects", () => {
    expect(isPresetActive({ start: 0, end: 20 }, 90, 20)).toBe(true);
  });
});

describe("setBound", () => {
  it("accepts an in-range edit to either side", () => {
    expect(setBound({ start: 10, end: 50 }, "start", 20, DURATION)).toEqual({
      start: 20,
      end: 50,
    });
    expect(setBound({ start: 10, end: 50 }, "end", 60, DURATION)).toEqual({
      start: 10,
      end: 60,
    });
  });

  it("stops the bounds from crossing", () => {
    const fromStart = setBound({ start: 10, end: 50 }, "start", 99, DURATION);
    expect(fromStart.start).toBeLessThan(fromStart.end);

    const fromEnd = setBound({ start: 10, end: 50 }, "end", 1, DURATION);
    expect(fromEnd.end).toBeGreaterThan(fromEnd.start);
  });

  it("clamps to the track", () => {
    expect(setBound({ start: 10, end: 50 }, "start", -20, DURATION).start).toBe(0);
    expect(setBound({ start: 10, end: 50 }, "end", 9999, DURATION).end).toBe(DURATION);
  });

  it("honours a tool's maximum clip length from either side", () => {
    const opts = { maxLength: 30 };
    expect(setBound({ start: 0, end: 30 }, "start", 0, DURATION, opts).end).toBe(30);

    const widened = setBound({ start: 0, end: 30 }, "end", 100, DURATION, opts);
    expect(widened.end - widened.start).toBeCloseTo(30, 5);
  });
});

describe("setLength", () => {
  it("resizes from the start", () => {
    expect(setLength({ start: 10, end: 20 }, 45, DURATION)).toEqual({ start: 10, end: 55 });
  });

  it("can't push the end past the track", () => {
    expect(setLength({ start: 190, end: 195 }, 60, DURATION).end).toBe(DURATION);
  });
});
