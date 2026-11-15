import { describe, expect, it } from "vitest";
import { displayStatus, pendingSteps } from "@/lib/escalation";
import { istInstant } from "@/lib/time";

const settings = { headsUpMin: 10, primaryAfterMin: 30, everyoneAfterMin: 60, appointmentReminderHours: [24, 2], refillWarnDays: 5 };
const at = (time: string) => istInstant("2026-11-15", time);
const dose = { date: "2026-11-15", time: "14:00" };

describe("pendingSteps", () => {
  it("sends a heads-up shortly before the dose", () => {
    expect(pendingSteps(dose, settings, at("13:52"))).toEqual(["headsUp"]);
  });

  it("nudges the elder at dose time", () => {
    expect(pendingSteps(dose, settings, at("14:00"))).toEqual(["due"]);
  });

  it("escalates to the primary caretaker after 30 minutes", () => {
    const log = { notified: { headsUp: true, due: true } };
    expect(pendingSteps({ ...dose, log }, settings, at("14:31"))).toEqual(["primary"]);
  });

  it("escalates to everyone after 60 minutes", () => {
    const log = { notified: { headsUp: true, due: true, primary: true } };
    expect(pendingSteps({ ...dose, log }, settings, at("15:05"))).toEqual(["everyone"]);
  });

  it("catches up on every missed step if the scheduler was late", () => {
    expect(pendingSteps(dose, settings, at("15:10"))).toEqual(["due", "primary", "everyone"]);
  });

  it("stops the ladder once the dose is taken", () => {
    expect(pendingSteps({ ...dose, log: { status: "taken", notified: {} } }, settings, at("15:10"))).toEqual([]);
  });

  it("sends one skip notice with the reason, then nothing", () => {
    expect(pendingSteps({ ...dose, log: { status: "skipped", notified: {} } }, settings, at("14:05"))).toEqual(["skip"]);
    expect(pendingSteps({ ...dose, log: { status: "skipped", notified: { skip: true } } }, settings, at("14:05"))).toEqual([]);
  });

  it("restarts the clock from the snooze time", () => {
    const log = { status: "snoozed" as const, snoozeUntil: at("14:15").toISOString(), notified: { due: true } };
    expect(pendingSteps({ ...dose, log }, settings, at("14:31"))).toEqual([]);
    expect(pendingSteps({ ...dose, log }, settings, at("14:46"))).toEqual(["primary"]);
  });

  it("never emails about doses older than six hours", () => {
    expect(pendingSteps(dose, settings, at("21:30"))).toEqual([]);
  });
});

describe("displayStatus", () => {
  it("moves from upcoming to due to missed", () => {
    expect(displayStatus(dose, settings, at("11:00"))).toBe("upcoming");
    expect(displayStatus(dose, settings, at("13:30"))).toBe("due");
    expect(displayStatus(dose, settings, at("14:45"))).toBe("missed");
  });
});
