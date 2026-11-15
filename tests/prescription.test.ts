import { describe, expect, it } from "vitest";
import { daysOfStockLeft, describeSlots, parsePattern } from "@/lib/prescription";

describe("parsePattern", () => {
  it("turns 1-0-1 after food into morning and night doses", () => {
    const r = parsePattern("1-0-1", "after");
    expect(r.ok).toBe(true);
    expect(r.slots.map((s) => [s.slot, s.time, s.count])).toEqual([
      ["morning", "08:30", 1],
      ["night", "21:00", 1],
    ]);
  });

  it("uses earlier times for before food", () => {
    expect(parsePattern("1-1-1", "before").slots.map((s) => s.time)).toEqual(["07:30", "13:00", "20:00"]);
  });

  it("supports the four-part format with an evening dose", () => {
    const r = parsePattern("1-1-1-1", "any");
    expect(r.slots.map((s) => s.slot)).toEqual(["morning", "afternoon", "evening", "night"]);
  });

  it("accepts half tablets and loose spacing", () => {
    const r = parsePattern(" ½ - 0 - 1 ");
    expect(r.ok).toBe(true);
    expect(r.slots[0]?.count).toBe(0.5);
  });

  it("rejects malformed patterns with a helpful message", () => {
    expect(parsePattern("twice daily").ok).toBe(false);
    expect(parsePattern("1-0").error).toMatch(/1-0-1/);
    expect(parsePattern("0-0-0").error).toMatch(/At least one/);
    expect(parsePattern("9-0-1").ok).toBe(false);
  });
});

describe("describeSlots", () => {
  it("writes a plain-language schedule", () => {
    const r = parsePattern("1-0-1", "after");
    expect(describeSlots(r.slots, "after")).toBe("8:30 AM after breakfast, 9:00 PM after dinner");
  });
});

describe("daysOfStockLeft", () => {
  it("divides stock by daily dose count", () => {
    expect(daysOfStockLeft(10, ["08:30", "21:00"], 1)).toBe(5);
    expect(daysOfStockLeft(5, ["21:00"], 1)).toBe(5);
    expect(daysOfStockLeft(3, [], 1)).toBe(Infinity);
  });
});
