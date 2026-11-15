import type { DoseLog, Medication, SkipReason } from "./types";
import { addDays, istInstant, slotLabel } from "./time";

export interface ScheduledDose {
  id: string;
  medication: Medication;
  date: string;
  time: string;
  log?: DoseLog;
}

export function doseId(medicationId: string, date: string, time: string): string {
  return `${medicationId}_${date}_${time}`;
}

/** Expands active medications into the concrete doses for one day, sorted by time. */
export function dosesForDate(meds: Medication[], logs: DoseLog[], date: string): ScheduledDose[] {
  const byId = new Map(logs.map((l) => [l.id, l]));
  const doses: ScheduledDose[] = [];
  for (const med of meds) {
    if (!med.active) continue;
    if (med.createdAt.slice(0, 10) > date) continue;
    for (const time of med.times) {
      const id = doseId(med.id, date, time);
      doses.push({ id, medication: med, date, time, log: byId.get(id) });
    }
  }
  return doses.sort((a, b) => a.time.localeCompare(b.time) || a.medication.name.localeCompare(b.medication.name));
}

export type CellStatus = "taken" | "late" | "missed" | "none";

export interface DayCell {
  date: string;
  slots: Record<"Morning" | "Afternoon" | "Evening" | "Night", CellStatus>;
}

const LATE_AFTER_MIN = 60;

function outcome(dose: ScheduledDose, now: Date): CellStatus | "pending" {
  const log = dose.log;
  if (log?.status === "taken" && log.actedAt) {
    const late = (new Date(log.actedAt).getTime() - istInstant(dose.date, dose.time).getTime()) / 60000 > LATE_AFTER_MIN;
    return late ? "late" : "taken";
  }
  if (log?.status === "skipped") return "missed";
  if (istInstant(dose.date, dose.time).getTime() + 60 * 60000 > now.getTime()) return "pending";
  return "missed";
}

const RANK: Record<CellStatus, number> = { none: 0, taken: 1, late: 2, missed: 3 };

export interface AdherenceReport {
  days: DayCell[];
  total: number;
  onTime: number;
  late: number;
  missed: number;
  onTimePct: number;
  perMedication: { medication: Medication; total: number; onTime: number; late: number; missed: number; topReason?: SkipReason }[];
  reasons: Partial<Record<SkipReason, number>>;
  missedBySlot: Record<string, number>;
  patterns: string[];
}

export const REASON_LABEL: Record<SkipReason, string> = {
  forgot: "forgot",
  unwell: "felt unwell",
  finished: "medicine ran out",
  side_effects: "side effects",
  other: "other reason",
};

export function buildAdherence(meds: Medication[], logs: DoseLog[], endDate: string, days: number, now: Date): AdherenceReport {
  const report: AdherenceReport = {
    days: [],
    total: 0,
    onTime: 0,
    late: 0,
    missed: 0,
    onTimePct: 0,
    perMedication: meds.map((medication) => ({ medication, total: 0, onTime: 0, late: 0, missed: 0 })),
    reasons: {},
    missedBySlot: {},
    patterns: [],
  };
  const medReasons = new Map<string, Partial<Record<SkipReason, number>>>();

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(endDate, -i);
    const cell: DayCell = { date, slots: { Morning: "none", Afternoon: "none", Evening: "none", Night: "none" } };
    for (const dose of dosesForDate(meds, logs, date)) {
      const result = outcome(dose, now);
      if (result === "pending") continue;
      const slot = slotLabel(dose.time) as keyof DayCell["slots"];
      if (RANK[result] > RANK[cell.slots[slot]]) cell.slots[slot] = result;
      const med = report.perMedication.find((m) => m.medication.id === dose.medication.id);
      report.total++;
      if (med) med.total++;
      if (result === "taken") { report.onTime++; if (med) med.onTime++; }
      if (result === "late") { report.late++; if (med) med.late++; }
      if (result === "missed") {
        report.missed++;
        if (med) med.missed++;
        report.missedBySlot[slot] = (report.missedBySlot[slot] ?? 0) + 1;
        const reason = dose.log?.reason;
        if (reason) {
          report.reasons[reason] = (report.reasons[reason] ?? 0) + 1;
          const r = medReasons.get(dose.medication.id) ?? {};
          r[reason] = (r[reason] ?? 0) + 1;
          medReasons.set(dose.medication.id, r);
        }
      }
    }
    report.days.push(cell);
  }

  for (const m of report.perMedication) {
    const r = medReasons.get(m.medication.id);
    if (r) m.topReason = (Object.entries(r).sort((a, b) => b[1] - a[1])[0]?.[0] as SkipReason) ?? undefined;
  }
  report.onTimePct = report.total ? Math.round((report.onTime / report.total) * 100) : 100;
  report.patterns = describePatterns(report);
  return report;
}

function describePatterns(r: AdherenceReport): string[] {
  const out: string[] = [];
  const worstSlot = Object.entries(r.missedBySlot).sort((a, b) => b[1] - a[1])[0];
  if (worstSlot && worstSlot[1] >= 2) {
    out.push(`${worstSlot[0]} doses are missed most often (${worstSlot[1]} of ${r.missed} missed doses).`);
  }
  const topReason = Object.entries(r.reasons).sort((a, b) => b[1] - a[1])[0];
  if (topReason) out.push(`Most common reason for skipping: ${REASON_LABEL[topReason[0] as SkipReason]} (${topReason[1]} times).`);
  const worstMed = [...r.perMedication].filter((m) => m.total > 0).sort((a, b) => b.missed / b.total - a.missed / a.total)[0];
  if (worstMed && worstMed.missed > 0) {
    out.push(`${worstMed.medication.name} has the lowest adherence (${Math.round(((worstMed.total - worstMed.missed) / worstMed.total) * 100)}% taken).`);
  }
  if (r.late > 0) out.push(`${r.late} doses were taken more than an hour late.`);
  if (out.length === 0) out.push("No worrying patterns. Doses are being taken on time.");
  return out;
}
