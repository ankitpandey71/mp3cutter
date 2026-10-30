import { describe, expect, it } from "vitest";
import { formatBytes, formatTime } from "@/lib/utils/formatTime";
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
