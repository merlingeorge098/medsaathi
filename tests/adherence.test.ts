import { describe, expect, it } from "vitest";
import { buildAdherence, dosesForDate, doseId } from "@/lib/adherence";
import { istInstant } from "@/lib/time";
import type { DoseLog, Medication } from "@/lib/types";

const med: Medication = {
  id: "m1",
  profileId: "p",
  name: "Amlodipine",
  strength: "5 mg",
  pattern: "0-1-0",
  food: "after",
  times: ["14:00"],
  dosePerTime: 1,
  stock: 10,
  active: true,
  createdAt: "2026-11-01T00:00:00Z",
};
const log = (date: string, partial: Partial<DoseLog>): DoseLog => ({
  id: doseId("m1", date, "14:00"),
  profileId: "p",
  medicationId: "m1",
  date,
  time: "14:00",
  notified: {},
  ...partial,
});

describe("adherence", () => {
  it("expands medications into the day's doses", () => {
    expect(dosesForDate([med], [], "2026-11-14").map((d) => d.time)).toEqual(["14:00"]);
    expect(dosesForDate([med], [], "2026-10-30")).toHaveLength(0);
  });

  it("classifies on-time, late and missed doses and finds the reason", () => {
    const logs = [
      log("2026-11-12", { status: "taken", actedAt: istInstant("2026-11-12", "14:10").toISOString() }),
      log("2026-11-13", { status: "taken", actedAt: istInstant("2026-11-13", "16:00").toISOString() }),
      log("2026-11-14", { status: "skipped", reason: "unwell" }),
    ];
    const r = buildAdherence([med], logs, "2026-11-14", 3, istInstant("2026-11-15", "09:00"));
    expect([r.onTime, r.late, r.missed]).toEqual([1, 1, 1]);
    expect(r.reasons.unwell).toBe(1);
    expect(r.patterns.join(" ")).toMatch(/felt unwell/);
    expect(r.days.map((d) => d.slots.Afternoon)).toEqual(["taken", "late", "missed"]);
  });
});
