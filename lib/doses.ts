import "server-only";
import { db } from "./db";
import { elderName, firstName, loadProfile, logActivity } from "./care";
import { REASON_LABEL } from "./adherence";
import { formatTime } from "./time";
import type { DoseLog, SkipReason } from "./types";

export interface DoseRef {
  medicationId: string;
  date: string;
  time: string;
}

/** Records a dose outcome. Shared by the in-app buttons and the one-tap email links. */
export async function applyDoseAction(profileId: string, actorId: string, actorName: string, ref: DoseRef, action: "taken" | "snooze" | "skip", reason?: SkipReason) {
  const store = await db();
  const med = await store.get("medications", ref.medicationId);
  if (!med || med.profileId !== profileId) throw new Error("Medicine not found");
  const id = `${ref.medicationId}_${ref.date}_${ref.time}`;
  const existing = await store.get("doseLogs", id);
  const log: DoseLog = existing ?? { id, profileId, medicationId: med.id, date: ref.date, time: ref.time, notified: {} };
  if (log.status === "taken" && action !== "taken") return log;
  const now = new Date();

  if (action === "taken") {
    if (log.status !== "taken") {
      med.stock = Math.max(0, med.stock - med.dosePerTime);
      await store.put("medications", med);
    }
    Object.assign(log, { status: "taken", actedAt: now.toISOString(), actedBy: actorId, reason: undefined, snoozeUntil: undefined });
  } else if (action === "snooze") {
    Object.assign(log, { status: "snoozed", snoozeUntil: new Date(now.getTime() + 15 * 60000).toISOString(), actedBy: actorId });
    // Restart the ladder from the new time.
    log.notified = { ...log.notified, headsUp: true, due: false };
  } else {
    Object.assign(log, { status: "skipped", actedAt: now.toISOString(), actedBy: actorId, reason: reason ?? "other" });
  }
  await store.put("doseLogs", log);

  const profile = await loadProfile(profileId);
  const who = actorName === profile.name ? elderName(profile) : firstName(actorName);
  const text =
    action === "taken"
      ? `${who} marked ${med.name} (${formatTime(ref.time)}) as taken${actorName === profile.name ? "" : ` for ${elderName(profile)}`}.`
      : action === "snooze"
        ? `${who} snoozed ${med.name} by 15 minutes.`
        : `${who} skipped ${med.name} (${formatTime(ref.time)}): ${REASON_LABEL[reason ?? "other"]}.`;
  await logActivity(profileId, actorName, "dose", text);
  return log;
}

