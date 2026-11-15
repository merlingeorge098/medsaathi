import type { DoseLog, EscalationSettings } from "./types";
import { istInstant } from "./time";

/**
 * The escalation ladder. Pure function so it can be unit tested and run from any scheduler.
 *
 *   T - headsUp  : gentle heads-up to the elder
 *   T            : "time for your medicine" to the elder
 *   T + 30 min   : primary caretaker is emailed
 *   T + 60 min   : everyone in the circle with alerts on is emailed
 *
 * A dose that is taken or skipped stops the ladder. A skip sends one notice to the primary
 * caretaker with the reason, so the family can help instead of just being told "missed".
 * Doses older than STALE_AFTER_MIN are ignored so a scheduler outage never floods inboxes.
 */
export type EscalationStep = "headsUp" | "due" | "primary" | "everyone" | "skip";

export const STALE_AFTER_MIN = 6 * 60;

export interface DoseState {
  date: string;
  time: string;
  log?: Pick<DoseLog, "status" | "snoozeUntil" | "notified">;
}

export function effectiveDoseTime(dose: DoseState): Date {
  if (dose.log?.status === "snoozed" && dose.log.snoozeUntil) return new Date(dose.log.snoozeUntil);
  return istInstant(dose.date, dose.time);
}

export function pendingSteps(dose: DoseState, settings: EscalationSettings, now: Date): EscalationStep[] {
  const notified = dose.log?.notified ?? {};
  const status = dose.log?.status;

  if (status === "taken") return [];
  if (status === "skipped") return notified.skip ? [] : ["skip"];

  const due = effectiveDoseTime(dose).getTime();
  const minsPast = (now.getTime() - due) / 60000;
  if (minsPast > STALE_AFTER_MIN) return [];

  const steps: EscalationStep[] = [];
  if (settings.headsUpMin > 0 && minsPast >= -settings.headsUpMin && minsPast < 0 && !notified.headsUp)
    steps.push("headsUp");
  if (minsPast >= 0 && !notified.due) steps.push("due");
  if (minsPast >= settings.primaryAfterMin && !notified.primary) steps.push("primary");
  if (minsPast >= settings.everyoneAfterMin && !notified.everyone) steps.push("everyone");
  return steps;
}

export type DoseDisplayStatus = "taken" | "skipped" | "missed" | "due" | "upcoming" | "snoozed";

/** What the dashboard should show for a dose right now. A dose becomes "missed" after the primary threshold. */
export function displayStatus(
  dose: DoseState,
  settings: Pick<EscalationSettings, "primaryAfterMin">,
  now: Date,
): DoseDisplayStatus {
  const status = dose.log?.status;
  if (status === "taken") return "taken";
  if (status === "skipped") return "skipped";
  const minsPast = (now.getTime() - effectiveDoseTime(dose).getTime()) / 60000;
  if (status === "snoozed" && minsPast < 0) return "snoozed";
  if (minsPast >= settings.primaryAfterMin) return "missed";
  if (minsPast >= -60) return "due";
  return "upcoming";
}
