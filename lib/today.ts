import { dosesForDate, type ScheduledDose } from "./adherence";
import { displayStatus, type DoseDisplayStatus } from "./escalation";
import { localNow } from "./time";
import type { DoseLog, EscalationSettings, Medication } from "./types";

export interface TodayDose extends ScheduledDose {
  status: DoseDisplayStatus;
}

export interface TodayView {
  date: string;
  doses: TodayDose[];
  /** The one dose the elder should act on now, if any. */
  current?: TodayDose;
  later: TodayDose[];
  taken: number;
}

export function buildToday(meds: Medication[], logs: DoseLog[], settings: EscalationSettings, now: Date = new Date()): TodayView {
  const { date } = localNow(now);
  const doses = dosesForDate(meds, logs, date).map((d) => ({ ...d, status: displayStatus({ date: d.date, time: d.time, log: d.log }, settings, now) }));
  const open = doses.filter((d) => d.status === "due" || d.status === "missed" || d.status === "snoozed");
  const current = open[0];
  return {
    date,
    doses,
    current,
    later: doses.filter((d) => d !== current && (d.status === "upcoming" || d.status === "due" || d.status === "snoozed" || d.status === "missed")),
    taken: doses.filter((d) => d.status === "taken").length,
  };
}
