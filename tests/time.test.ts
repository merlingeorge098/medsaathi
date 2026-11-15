import { describe, expect, it } from "vitest";
import { addDays, formatTime, istInstant, localNow } from "@/lib/time";

describe("IST time handling", () => {
  it("reports the Indian date even when UTC is still on the previous day", () => {
    // 20:00 UTC on the 14th is 01:30 IST on the 15th
    const now = localNow(new Date("2026-11-14T20:00:00Z"));
    expect(now.date).toBe("2026-11-15");
    expect(now.minutes).toBe(90);
  });

  it("builds absolute instants from IST wall-clock times", () => {
    expect(istInstant("2026-11-15", "08:30").toISOString()).toBe("2026-11-15T03:00:00.000Z");
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-01", -1)).toBe("2026-11-30");
  });

  it("formats 12-hour clock times", () => {
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("14:00")).toBe("2:00 PM");
  });
});
