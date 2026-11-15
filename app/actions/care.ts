"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, newId } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { elderName, firstName, loadProfile, logActivity } from "@/lib/care";
import { needsElderApproval } from "@/lib/permissions";
import { parsePattern } from "@/lib/prescription";
import { formatTime, localNow } from "@/lib/time";
import { applyDoseAction } from "@/lib/doses";
import type { ChangeRequest, Medication, Mood } from "@/lib/types";
import type { FormState } from "./auth";

function refreshAll() {
  revalidatePath("/elder", "layout");
  revalidatePath("/circle", "layout");
}

/* ---------------------------------- Doses --------------------------------- */

const doseRef = z.object({
  medicationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function markDose(form: FormData): Promise<void> {
  const session = await requireSession("logDose");
  const ref = doseRef.parse({ medicationId: form.get("medicationId"), date: form.get("date"), time: form.get("time") });
  const parsedAction = z.enum(["taken", "snooze"]).safeParse(form.get("action"));
  if (!parsedAction.success) redirect(session.role === "owner" ? "/elder" : "/circle");
  const action = parsedAction.data;
  await applyDoseAction(session.profileId, session.memberId, session.name, ref, action);
  refreshAll();
}

const reasons = z.enum(["forgot", "unwell", "finished", "side_effects", "other"]);

export async function skipDose(form: FormData): Promise<void> {
  const session = await requireSession("logDose");
  const ref = doseRef.parse({ medicationId: form.get("medicationId"), date: form.get("date"), time: form.get("time") });
  const reason = reasons.parse(form.get("reason"));
  await applyDoseAction(session.profileId, session.memberId, session.name, ref, "skip", reason);
  refreshAll();
  redirect("/elder?skipped=1");
}

/* ------------------------------- Medications ------------------------------- */

const medSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Medicine name is required").max(60),
  strength: z.string().trim().max(20).default(""),
  purpose: z.string().trim().max(40).optional(),
  shape: z.string().trim().max(20).optional(),
  color: z.string().trim().max(20).optional(),
  pattern: z.string().trim().min(5, "Enter the prescription like 1-0-1"),
  food: z.enum(["before", "after", "any"]),
  times: z.string().optional(),
  stock: z.coerce.number().int().min(0).max(1000),
  note: z.string().trim().max(200).optional(),
});

export async function saveMedication(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession("proposeMedication");
  const parsed = medSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const schedule = parsePattern(d.pattern, d.food);
  if (!schedule.ok) return { error: schedule.error };

  // Caretakers may fine-tune the suggested times; one HH:mm per slot.
  const custom = (d.times ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => /^\d{2}:\d{2}$/.test(t));
  const times = custom.length === schedule.slots.length ? custom : schedule.slots.map((s) => s.time);
  const dosePerTime = Math.max(...schedule.slots.map((s) => s.count));

  const store = await db();
  const existing = d.id ? await store.get("medications", d.id) : null;
  if (d.id && (!existing || existing.profileId !== session.profileId)) return { error: "Medicine not found" };

  const next: Medication = {
    id: existing?.id ?? newId("med"),
    profileId: session.profileId,
    name: d.name,
    strength: d.strength,
    purpose: d.purpose,
    shape: d.shape,
    color: d.color,
    pattern: d.pattern.replace(/\s+/g, ""),
    food: d.food,
    times,
    dosePerTime,
    stock: d.stock,
    active: true,
    notes: existing?.notes,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const profile = await loadProfile(session.profileId);

  if (!needsElderApproval(session.role)) {
    await store.put("medications", next);
    await logActivity(
      session.profileId,
      session.name,
      "medicine",
      `${elderName(profile)} ${existing ? "updated" : "added"} ${next.name} ${next.strength}.`,
    );
    refreshAll();
    redirect(session.role === "owner" ? "/elder" : "/circle/medicines");
  }

  const request: ChangeRequest = {
    id: newId("cr"),
    profileId: session.profileId,
    kind: existing ? "update_medication" : "add_medication",
    medicationId: existing?.id,
    before: existing
      ? {
          times: existing.times,
          pattern: existing.pattern,
          strength: existing.strength,
          stock: existing.stock,
          food: existing.food,
        }
      : undefined,
    after: next,
    note: d.note,
    requestedBy: session.memberId,
    requestedByName: session.name,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await store.put("changeRequests", request);
  await logActivity(
    session.profileId,
    session.name,
    "medicine",
    `${firstName(session.name)} asked to ${existing ? "change" : "add"} ${next.name}. Waiting for ${elderName(profile)}.`,
  );
  refreshAll();
  redirect("/circle/medicines?sent=1");
}

export async function removeMedication(form: FormData): Promise<void> {
  const session = await requireSession("proposeMedication");
  const id = z.string().parse(form.get("id"));
  const store = await db();
  const med = await store.get("medications", id);
  if (!med || med.profileId !== session.profileId) return;
  const profile = await loadProfile(session.profileId);
  if (!needsElderApproval(session.role)) {
    await store.put("medications", { ...med, active: false });
    await logActivity(session.profileId, session.name, "medicine", `${elderName(profile)} stopped ${med.name}.`);
  } else {
    await store.put("changeRequests", {
      id: newId("cr"),
      profileId: session.profileId,
      kind: "remove_medication",
      medicationId: med.id,
      before: { name: med.name, strength: med.strength, times: med.times },
      requestedBy: session.memberId,
      requestedByName: session.name,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    await logActivity(
      session.profileId,
      session.name,
      "medicine",
      `${firstName(session.name)} asked to stop ${med.name}. Waiting for ${elderName(profile)}.`,
    );
  }
  refreshAll();
}

/* -------------------------------- Approvals -------------------------------- */

export async function decideChange(form: FormData): Promise<void> {
  const session = await requireSession("approveChanges");
  const id = z.string().parse(form.get("id"));
  const parsedDecision = z.enum(["approved", "declined", "later"]).safeParse(form.get("decision"));
  if (!parsedDecision.success) redirect("/elder/approvals");
  const decision = parsedDecision.data;
  if (decision === "later") redirect("/elder");
  const store = await db();
  const req = await store.get("changeRequests", id);
  if (!req || req.profileId !== session.profileId || req.status !== "pending") redirect("/elder/approvals");

  const profile = await loadProfile(session.profileId);
  let label = "a medicine";
  if (decision === "approved") {
    if (req.kind === "add_medication" && req.after) {
      const med = {
        ...(req.after as Medication),
        id: req.after.id ?? newId("med"),
        profileId: session.profileId,
        active: true,
      };
      await store.put("medications", med);
      label = med.name;
    } else if (req.medicationId) {
      const med = await store.get("medications", req.medicationId);
      if (med) {
        label = med.name;
        await store.put(
          "medications",
          req.kind === "remove_medication"
            ? { ...med, active: false }
            : { ...med, ...req.after, id: med.id, profileId: med.profileId, createdAt: med.createdAt },
        );
      }
    }
  } else {
    label = (req.after?.name ?? req.before?.name ?? label) as string;
  }
  if (req.medicationId && label === "a medicine")
    label = (await store.get("medications", req.medicationId))?.name ?? label;
  await store.put("changeRequests", { ...req, status: decision, decidedAt: new Date().toISOString() });
  await logActivity(
    session.profileId,
    session.name,
    "medicine",
    `${elderName(profile)} ${decision === "approved" ? "approved" : "said no to"} ${firstName(req.requestedByName)}'s change to ${label}.`,
  );
  refreshAll();
  redirect("/elder/approvals");
}

export async function decideMember(form: FormData): Promise<void> {
  const session = await requireSession("manageMembers");
  const id = z.string().parse(form.get("id"));
  const parsedDecision = z.enum(["allow", "deny"]).safeParse(form.get("decision"));
  if (!parsedDecision.success) redirect("/elder/approvals");
  const decision = parsedDecision.data;
  const role = z.enum(["viewer", "editor", "primary"]).catch("viewer").parse(form.get("role"));
  const store = await db();
  const member = await store.get("members", id);
  if (!member || member.profileId !== session.profileId) return;
  const profile = await loadProfile(session.profileId);
  if (decision === "allow") {
    await store.put("members", { ...member, status: "active", role, alerts: role !== "viewer" });
    await logActivity(
      session.profileId,
      session.name,
      "member",
      `${elderName(profile)} let ${member.name} join as ${role === "primary" ? "main caretaker" : role === "editor" ? "Can edit" : "Can view"}.`,
    );
  } else {
    await store.put("members", { ...member, status: "declined" });
    await logActivity(
      session.profileId,
      session.name,
      "member",
      `${elderName(profile)} did not allow ${member.name} to join.`,
    );
  }
  refreshAll();
  redirect("/elder/approvals");
}

export async function updateMemberRole(form: FormData): Promise<void> {
  const session = await requireSession("manageMembers");
  const id = z.string().parse(form.get("id"));
  const role = z.enum(["viewer", "editor", "primary"]).parse(form.get("role"));
  const store = await db();
  const member = await store.get("members", id);
  if (!member || member.profileId !== session.profileId || member.role === "owner") return;
  await store.put("members", { ...member, role });
  await logActivity(session.profileId, session.name, "member", `${member.name}'s access changed to ${role}.`);
  refreshAll();
}

export async function toggleAlerts(form: FormData): Promise<void> {
  const session = await requireSession("view");
  const id = z.string().parse(form.get("id"));
  const store = await db();
  const member = await store.get("members", id);
  if (!member || member.profileId !== session.profileId) return;
  // Everyone controls their own alerts; the elder and primary caretaker can change anyone's.
  if (member.id !== session.memberId && session.role !== "owner" && session.role !== "primary") return;
  await store.put("members", { ...member, alerts: !member.alerts });
  refreshAll();
}

/* ------------------------------- Appointments ------------------------------ */

const apptSchema = z.object({
  doctor: z.string().trim().min(2, "Doctor's name is required").max(60),
  specialty: z.string().trim().max(40).default(""),
  clinic: z.string().trim().min(2, "Clinic is required").max(80),
  address: z.string().trim().max(120).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
  carry: z.string().max(300).optional(),
});

export async function createAppointment(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession("manageAppointments");
  const parsed = apptSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const at = new Date(`${d.date}T${d.time}:00+05:30`);
  if (at.getTime() < Date.now()) return { error: "That time is in the past." };
  const store = await db();
  await store.put("appointments", {
    id: newId("appt"),
    profileId: session.profileId,
    doctor: d.doctor,
    specialty: d.specialty,
    clinic: d.clinic,
    address: d.address,
    at: at.toISOString(),
    carry: (d.carry ?? "Old prescription, Medicine strips")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((label) => ({ label, done: false })),
    questions: [],
    notified: {},
    createdAt: new Date().toISOString(),
  });
  await logActivity(
    session.profileId,
    session.name,
    "appointment",
    `${firstName(session.name)} booked ${d.doctor} on ${d.date} at ${formatTime(d.time)}.`,
  );
  refreshAll();
  return { ok: "Appointment added. Reminders go out a day before and 2 hours before." };
}

export async function claimEscort(form: FormData): Promise<void> {
  const session = await requireSession("manageAppointments");
  const id = z.string().parse(form.get("id"));
  const store = await db();
  const appt = await store.get("appointments", id);
  if (!appt || appt.profileId !== session.profileId) return;
  const release = appt.escortMemberId === session.memberId;
  await store.put("appointments", { ...appt, escortMemberId: release ? undefined : session.memberId });
  const profile = await loadProfile(session.profileId);
  await logActivity(
    session.profileId,
    session.name,
    "appointment",
    release
      ? `${firstName(session.name)} can no longer go to ${appt.doctor}.`
      : `${firstName(session.name)} will take ${elderName(profile)} to ${appt.doctor}.`,
  );
  refreshAll();
}

export async function toggleCarry(form: FormData): Promise<void> {
  const session = await requireSession("view");
  if (session.role === "viewer") return;
  const id = z.string().parse(form.get("id"));
  const index = z.coerce.number().int().min(0).parse(form.get("index"));
  const store = await db();
  const appt = await store.get("appointments", id);
  if (!appt || appt.profileId !== session.profileId || !appt.carry[index]) return;
  appt.carry[index]!.done = !appt.carry[index]!.done;
  await store.put("appointments", appt);
  refreshAll();
}

export async function addQuestion(form: FormData): Promise<void> {
  const session = await requireSession("view");
  if (session.role === "viewer") return;
  const id = z.string().parse(form.get("id"));
  const text = z.string().trim().min(3).max(200).safeParse(form.get("text"));
  if (!text.success) return;
  const store = await db();
  const appt = await store.get("appointments", id);
  if (!appt || appt.profileId !== session.profileId) return;
  appt.questions.push({ text: text.data, by: session.name });
  await store.put("appointments", appt);
  await logActivity(
    session.profileId,
    session.name,
    "appointment",
    `${firstName(session.name)} added a question for ${appt.doctor}.`,
  );
  refreshAll();
}

/* --------------------------------- Check-in -------------------------------- */

export async function checkIn(form: FormData): Promise<void> {
  const session = await requireSession("checkIn");
  const mood = z.enum(["good", "okay", "unwell"]).parse(form.get("mood")) as Mood;
  const note = z
    .string()
    .trim()
    .max(300)
    .optional()
    .parse(form.get("note") || undefined);
  const store = await db();
  await store.put("checkIns", {
    id: newId("ci"),
    profileId: session.profileId,
    mood,
    note,
    at: new Date().toISOString(),
  });
  const profile = await loadProfile(session.profileId);
  const label = { good: "good", okay: "okay", unwell: "not well" }[mood];
  await logActivity(
    session.profileId,
    session.name,
    "checkin",
    `${elderName(profile)} checked in: feeling ${label}.${note ? ` "${note}"` : ""}`,
  );

  if (mood === "unwell") {
    const { sendEmail, emailLayout } = await import("@/lib/email");
    const members = (await store.byProfile("members", session.profileId)).filter(
      (m) => m.status === "active" && m.alerts && m.role !== "owner" && m.email,
    );
    for (const m of members) {
      await sendEmail({
        profileId: session.profileId,
        to: m.email,
        kind: "checkin_unwell",
        subject: `${elderName(profile)} is not feeling well today`,
        html: emailLayout({
          heading: `${elderName(profile)} said they are not feeling well`,
          lines: [
            note ? `They added: "${note}"` : "No note was added.",
            profile.phone ? `Call: ${profile.phone}` : "",
          ].filter(Boolean),
          footer: "Sent from the daily check-in on MedSaathi.",
        }),
      });
    }
  }
  refreshAll();
  redirect("/elder?checkedIn=1");
}

/* -------------------------------- Settings -------------------------------- */

const escalationSchema = z.object({
  headsUpMin: z.coerce.number().int().min(0).max(60),
  primaryAfterMin: z.coerce.number().int().min(5).max(240),
  everyoneAfterMin: z.coerce.number().int().min(10).max(480),
  refillWarnDays: z.coerce.number().int().min(1).max(30),
});

export async function saveEscalation(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession("editEscalation");
  const parsed = escalationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (parsed.data.everyoneAfterMin <= parsed.data.primaryAfterMin)
    return { error: "Everyone should be told after the primary caretaker, not before." };
  const store = await db();
  const profile = await loadProfile(session.profileId);
  await store.put("profiles", { ...profile, escalation: { ...profile.escalation, ...parsed.data } });
  await logActivity(
    session.profileId,
    session.name,
    "settings",
    `${firstName(session.name)} updated the reminder ladder.`,
  );
  refreshAll();
  return { ok: "Saved. New timings apply from the next dose." };
}

/* ------------------------------ Reminder tools ----------------------------- */

export async function runRemindersNow(_prev?: FormState): Promise<FormState> {
  await requireSession("view");
  const { runReminders } = await import("@/lib/reminders");
  const summary = await runReminders();
  refreshAll();
  return {
    ok: summary.steps.length
      ? `Checked all doses. Sent ${summary.emails} email(s) for ${summary.steps.length} step(s).`
      : "Checked all doses. Nothing is due right now.",
  };
}

export async function sendTestReminder(_: FormState, form: FormData): Promise<FormState> {
  const session = await requireSession("view");
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Please enter a valid email." };
  const store = await db();
  const profile = await loadProfile(session.profileId);
  const meds = (await store.byProfile("medications", session.profileId)).filter((m) => m.active);
  const med = meds[0];
  if (!med) return { error: "Add a medicine first." };
  const { actionLink } = await import("@/lib/reminders");
  const { sendEmail, emailLayout, emailConfigured } = await import("@/lib/email");
  const { date } = localNow();
  const time = med.times[0]!;
  const id = `${med.id}_${date}_${time}`;
  const [taken, snooze] = await Promise.all([
    actionLink(id, "taken", session.memberId),
    actionLink(id, "snooze", session.memberId),
  ]);
  const delivered = await sendEmail({
    profileId: session.profileId,
    to: email.data,
    kind: "test_missed",
    subject: `${elderName(profile)} hasn't taken the ${formatTime(time)} medicine`,
    html: emailLayout({
      heading: `${elderName(profile)} hasn't taken the ${formatTime(time)} medicine`,
      lines: ["This is a live sample of the missed-dose alert. The buttons below really update the dashboard."],
      card: {
        title: `${med.name} ${med.strength}`,
        detail: `${med.dosePerTime} tablet, ${formatTime(time)}, ${med.food} food`,
      },
      buttons: [
        { label: `${elderName(profile)} has taken it`, href: taken, primary: true },
        { label: "Snooze 15 min", href: snooze },
      ],
      footer: "Sent from the MedSaathi demo.",
    }),
  });
  refreshAll();
  if (!emailConfigured())
    return { ok: "Email saved to the outbox below. Add Gmail credentials to deliver it for real." };
  return delivered
    ? { ok: `Sent to ${email.data}. Check your inbox and tap a button.` }
    : { error: "Couldn't deliver the email. It's saved in the outbox." };
}
