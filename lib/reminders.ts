import "server-only";
import { db } from "./db";
import { appUrl, emailLayout, sendEmail } from "./email";
import { dosesForDate, REASON_LABEL, type ScheduledDose } from "./adherence";
import { pendingSteps, type EscalationStep } from "./escalation";
import { addDays, formatDateTime, formatTime, localNow } from "./time";
import { signToken } from "./session";
import { daysOfStockLeft } from "./prescription";
import { elderName, firstName } from "./care";
import type { DoseLog, Member, Profile } from "./types";

/**
 * The reminder engine. Called every few minutes by an external scheduler (cron-job.org or
 * Google Cloud Scheduler) through /api/cron/reminders, and on demand from the Outbox page.
 * It is idempotent: every step is recorded on the dose log, so running it twice sends nothing twice.
 */
export interface RunSummary {
  profiles: number;
  emails: number;
  steps: { profile: string; dose: string; step: string }[];
}

export async function actionLink(doseIdValue: string, action: "taken" | "snooze", memberId: string): Promise<string> {
  const token = await signToken({ doseId: doseIdValue, action, memberId }, "12h");
  return `${appUrl()}/api/dose-action?token=${encodeURIComponent(token)}`;
}

function recipients(step: EscalationStep, profile: Profile, members: Member[]): Member[] {
  const active = members.filter((m) => m.status === "active" && m.email);
  if (step === "headsUp" || step === "due") return active.filter((m) => m.role === "owner");
  if (step === "primary" || step === "skip") return active.filter((m) => m.role === "primary");
  return active.filter((m) => m.role !== "owner" && m.alerts);
}

async function buildDoseEmail(step: EscalationStep, dose: ScheduledDose, profile: Profile, to: Member) {
  const name = elderName(profile);
  const med = dose.medication;
  const card = { title: `${med.name} ${med.strength}`, detail: `${med.dosePerTime} tablet${med.dosePerTime > 1 ? "s" : ""}, ${formatTime(dose.time)}${med.food === "any" ? "" : `, ${med.food} food`}` };
  const footer = `You're getting this because you are in ${name}'s care circle on MedSaathi. Change alerts in Reminders.`;
  const [taken, snooze] = await Promise.all([actionLink(dose.id, "taken", to.id), actionLink(dose.id, "snooze", to.id)]);

  switch (step) {
    case "headsUp":
      return { subject: `In a few minutes: ${med.name} at ${formatTime(dose.time)}`, html: emailLayout({ heading: `Namaste ${name}, your medicine is coming up`, lines: ["Keep a glass of water ready."], card, buttons: [{ label: "I took it", href: taken, primary: true }], footer }) };
    case "due":
      return { subject: `Time for ${med.name} ${med.strength}`, html: emailLayout({ heading: `${name}, it's time for your medicine`, lines: [], card, buttons: [{ label: "I took it", href: taken, primary: true }, { label: "Remind me in 15 min", href: snooze }], footer }) };
    case "primary":
    case "everyone":
      return {
        subject: `${name} hasn't taken the ${formatTime(dose.time)} medicine`,
        html: emailLayout({
          heading: `${name} hasn't taken the ${formatTime(dose.time)} medicine`,
          lines: [`Hi ${firstName(to.name)}, this dose has not been marked as taken yet. A quick call usually sorts it out.`, profile.phone ? `Call ${name}: ${profile.phone}` : ""].filter(Boolean),
          card,
          buttons: [{ label: `${name} has taken it`, href: taken, primary: true }, { label: "Snooze 15 min", href: snooze }],
          footer,
        }),
      };
    case "skip":
      return {
        subject: `${name} skipped ${med.name}: ${REASON_LABEL[dose.log?.reason ?? "other"]}`,
        html: emailLayout({
          heading: `${name} skipped a dose`,
          lines: [`Reason given: ${REASON_LABEL[dose.log?.reason ?? "other"]}.`, dose.log?.reason === "finished" ? "The strip may have run out. Please arrange a refill." : "You may want to check in with a call."],
          card,
          footer,
        }),
      };
  }
}

export async function runReminders(now: Date = new Date()): Promise<RunSummary> {
  const store = await db();
  const summary: RunSummary = { profiles: 0, emails: 0, steps: [] };
  const profiles = await store.all("profiles");
  const { date: today } = localNow(now);

  for (const profile of profiles) {
    summary.profiles++;
    const [members, meds, logs, appointments] = await Promise.all([
      store.byProfile("members", profile.id),
      store.byProfile("medications", profile.id),
      store.byProfile("doseLogs", profile.id),
      store.byProfile("appointments", profile.id),
    ]);

    // Doses: yesterday covers late-night doses whose ladder runs past midnight.
    const doses = [...dosesForDate(meds, logs, addDays(today, -1)), ...dosesForDate(meds, logs, today)];
    for (const dose of doses) {
      const steps = pendingSteps({ date: dose.date, time: dose.time, log: dose.log }, profile.escalation, now);
      if (steps.length === 0) continue;
      const log: DoseLog = dose.log ?? { id: dose.id, profileId: profile.id, medicationId: dose.medication.id, date: dose.date, time: dose.time, notified: {} };
      for (const step of steps) {
        for (const to of recipients(step, profile, members)) {
          const mail = await buildDoseEmail(step, dose, profile, to);
          await sendEmail({ profileId: profile.id, to: to.email, subject: mail.subject, html: mail.html, kind: `dose_${step}` });
          summary.emails++;
        }
        log.notified[step] = true;
        summary.steps.push({ profile: profile.name, dose: `${dose.medication.name} ${dose.time}`, step });
      }
      await store.put("doseLogs", log);
    }

    // Appointments: reminders 24h and 2h before, to the elder, the escort and the primary caretaker.
    for (const appt of appointments) {
      const hoursUntil = (new Date(appt.at).getTime() - now.getTime()) / 3600000;
      for (const h of profile.escalation.appointmentReminderHours) {
        const key = `${h}h`;
        if (appt.notified[key] || hoursUntil > h || hoursUntil < 0) continue;
        const to = members.filter((m) => m.status === "active" && m.email && (m.role === "owner" || m.role === "primary" || m.id === appt.escortMemberId));
        const escort = members.find((m) => m.id === appt.escortMemberId);
        const calendar = googleCalendarLink(appt.doctor, appt.clinic, appt.address, appt.at);
        for (const m of to) {
          await sendEmail({
            profileId: profile.id,
            to: m.email,
            kind: "appointment",
            subject: `${h >= 24 ? "Tomorrow" : "In 2 hours"}: ${appt.doctor} for ${elderName(profile)}`,
            html: emailLayout({
              heading: `${elderName(profile)}'s appointment with ${appt.doctor}`,
              lines: [escort ? `${firstName(escort.name)} is going along.` : "Nobody has said they will go along yet.", `Carry: ${appt.carry.map((c) => c.label).join(", ") || "nothing listed"}.`],
              card: { title: formatDateTime(appt.at), detail: `${appt.clinic}, ${appt.address}` },
              buttons: [
                { label: "Add to Google Calendar", href: calendar, primary: true },
                { label: "Open in Google Maps", href: googleMapsLink(`${appt.clinic}, ${appt.address}`) },
              ],
              footer: "You're getting this because you are in the care circle on MedSaathi.",
            }),
          });
          summary.emails++;
        }
        appt.notified[key] = true;
        await store.put("appointments", appt);
        summary.steps.push({ profile: profile.name, dose: appt.doctor, step: `appointment_${key}` });
      }
    }

    // Refill warnings: once per medication per day.
    for (const med of meds.filter((m) => m.active)) {
      const left = daysOfStockLeft(med.stock, med.times, med.dosePerTime);
      if (left > profile.escalation.refillWarnDays) continue;
      const key = `refill_${med.id}_${today}`;
      if (await store.get("activity", key)) continue;
      const primary = members.filter((m) => m.role === "primary" && m.status === "active" && m.email);
      for (const m of primary) {
        await sendEmail({
          profileId: profile.id,
          to: m.email,
          kind: "refill",
          subject: `Refill soon: ${med.name} has ${left} day${left === 1 ? "" : "s"} left`,
          html: emailLayout({ heading: `${med.name} is running low`, lines: [`About ${med.stock} tablets left, enough for ${left} day${left === 1 ? "" : "s"}.`], footer: "Refill warnings can be changed in Reminders." }),
        });
        summary.emails++;
      }
      await store.put("activity", { id: key, profileId: profile.id, actor: "MedSaathi", kind: "medicine", text: `Refill reminder sent for ${med.name} (${left} days left).`, at: now.toISOString() });
    }
  }
  return summary;
}

export function googleCalendarLink(doctor: string, clinic: string, address: string, iso: string): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + 60 * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: `Doctor visit: ${doctor}`, dates: `${fmt(start)}/${fmt(end)}`, location: `${clinic}, ${address}`, details: "Added from MedSaathi" });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function googleMapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
