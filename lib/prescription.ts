import type { FoodTiming, Slot } from "./types";

/**
 * Indian prescriptions are usually written as "1-0-1" (morning-afternoon-night) or
 * "1-1-1-1" (morning-afternoon-evening-night), with "before food" or "after food".
 * This turns that shorthand into concrete IST times the reminder engine can use.
 */

export interface ParsedSlot {
  slot: Slot;
  count: number;
  time: string;
}

export interface ParseResult {
  ok: boolean;
  slots: ParsedSlot[];
  error?: string;
}

const THREE_PART: Slot[] = ["morning", "afternoon", "night"];
const FOUR_PART: Slot[] = ["morning", "afternoon", "evening", "night"];

/** Default clock times around typical Indian meal times. */
export const DEFAULT_TIMES: Record<Slot, Record<FoodTiming, string>> = {
  morning: { before: "07:30", after: "08:30", any: "08:00" },
  afternoon: { before: "13:00", after: "14:00", any: "14:00" },
  evening: { before: "17:30", after: "18:30", any: "18:00" },
  night: { before: "20:00", after: "21:00", any: "21:00" },
};

function parseCount(raw: string): number | null {
  const value = raw.trim().replace("½", "0.5");
  if (!/^\d+(\.5)?$/.test(value)) return null;
  const n = Number(value);
  return n >= 0 && n <= 4 ? n : null;
}

export function parsePattern(pattern: string, food: FoodTiming = "after"): ParseResult {
  const cleaned = pattern.replace(/\s+/g, "").replace(/[–—x×]/g, "-");
  const parts = cleaned.split("-");
  if (parts.length !== 3 && parts.length !== 4) {
    return { ok: false, slots: [], error: "Use the prescription format like 1-0-1 or 1-1-1-1" };
  }
  const order = parts.length === 3 ? THREE_PART : FOUR_PART;
  const slots: ParsedSlot[] = [];
  for (let i = 0; i < parts.length; i++) {
    const count = parseCount(parts[i] ?? "");
    if (count === null) return { ok: false, slots: [], error: `"${parts[i]}" is not a valid tablet count` };
    const slot = order[i]!;
    if (count > 0) slots.push({ slot, count, time: DEFAULT_TIMES[slot][food] });
  }
  if (slots.length === 0) return { ok: false, slots: [], error: "At least one dose is needed" };
  return { ok: true, slots };
}

/** Human description, e.g. "8:30 AM after breakfast, 9:00 PM after dinner". */
export function describeSlots(slots: ParsedSlot[], food: FoodTiming): string {
  const meal: Record<Slot, string> = { morning: "breakfast", afternoon: "lunch", evening: "snacks", night: "dinner" };
  return slots
    .map((s) => {
      const [h, m] = s.time.split(":").map(Number);
      const hh = h! % 12 === 0 ? 12 : h! % 12;
      const clock = `${hh}:${String(m).padStart(2, "0")} ${h! >= 12 ? "PM" : "AM"}`;
      const tail = food === "any" ? "" : ` ${food} ${meal[s.slot]}`;
      const qty = s.count === 1 ? "" : ` (${s.count} tablets)`;
      return `${clock}${tail}${qty}`;
    })
    .join(", ");
}

export function dailyCount(times: string[], dosePerTime: number): number {
  return times.length * dosePerTime;
}

export function daysOfStockLeft(stock: number, times: string[], dosePerTime: number): number {
  const perDay = dailyCount(times, dosePerTime);
  if (perDay <= 0) return Infinity;
  return Math.floor(stock / perDay);
}
