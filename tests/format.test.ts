import { describe, expect, it } from "vitest";
import { formatBytes, formatPrecise, formatTime, parseTime } from "@/lib/utils/formatTime";
import { baseName } from "@/lib/utils/download";

describe("formatTime", () => {
  it("formats sub-minute and multi-minute values", () => {
    expect(formatTime(0)).toBe("00:00.00");
    expect(formatTime(9.5)).toBe("00:09.50");
    expect(formatTime(61.25)).toBe("01:01.25");
    expect(formatTime(3600)).toBe("60:00.00");
  });

  it("falls back to zero for negative and non-finite input", () => {
    expect(formatTime(-1)).toBe("00:00.00");
    expect(formatTime(NaN)).toBe("00:00.00");
    expect(formatTime(Infinity)).toBe("00:00.00");
  });
});

describe("formatBytes", () => {
  it("picks the unit that keeps the number readable", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("baseName", () => {
  it("drops only the final extension", () => {
    expect(baseName("song.mp3")).toBe("song");
    expect(baseName("my.favourite.song.wav")).toBe("my.favourite.song");
    expect(baseName("no-extension")).toBe("no-extension");
  });
});

describe("formatPrecise", () => {
  it("always shows three decimal places", () => {
    expect(formatPrecise(0)).toBe("00:00.000");
    expect(formatPrecise(4.25)).toBe("00:04.250");
    expect(formatPrecise(83.456)).toBe("01:23.456");
  });

  it("keeps counting minutes past an hour", () => {
    expect(formatPrecise(3723.5)).toBe("62:03.500");
  });

  it("clamps negative and non-finite input to zero", () => {
    expect(formatPrecise(-3)).toBe("00:00.000");
    expect(formatPrecise(NaN)).toBe("00:00.000");
  });
});

describe("parseTime", () => {
  it("reads the formats someone is likely to type", () => {
    expect(parseTime("1:23.456")).toBeCloseTo(83.456, 5);
    expect(parseTime("01:23")).toBe(83);
    expect(parseTime("83.456")).toBeCloseTo(83.456, 5);
    expect(parseTime("83")).toBe(83);
    expect(parseTime("1:02:03")).toBe(3723);
    expect(parseTime("  00:04.250  ")).toBeCloseTo(4.25, 5);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(parseTime("1:23,5")).toBeCloseTo(83.5, 5);
  });

  it("round-trips whatever formatPrecise produces", () => {
    for (const value of [0, 4.25, 83.456, 3723.5]) {
      expect(parseTime(formatPrecise(value))).toBeCloseTo(value, 3);
    }
  });

  it("rejects anything that isn't a time", () => {
    for (const bad of ["", "   ", "abc", "1:2:3:4", "-5", "1:60", "1:60.5", "1:02:60", "1.2.3", "::", "1:"]) {
      expect(parseTime(bad), bad).toBeNull();
    }
  });
});
