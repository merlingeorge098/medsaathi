"use client";

import { useActionState } from "react";
import { createAppointment, runRemindersNow, saveEscalation, sendTestReminder } from "@/app/actions/care";
import { makeDoctorSummary, type SummaryState } from "@/app/actions/ai";
import type { EscalationSettings } from "@/lib/types";
import { SubmitButton } from "../client";
import { Notice } from "../ui";
import { Feedback, Field } from "./shared";

/* ------------------------------- Appointments ------------------------------ */

export function AppointmentForm() {
  const [state, action] = useActionState(createAppointment, {});
  return (
    <form action={action} className="card space-y-4 p-5">
      <p className="text-lg font-bold">Add an appointment</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Doctor">
          <input name="doctor" required className="field" placeholder="Dr. Anjali Kulkarni" />
        </Field>
        <Field label="Speciality">
          <input name="specialty" className="field" placeholder="Cardiologist" />
        </Field>
        <Field label="Clinic or hospital">
          <input name="clinic" required className="field" placeholder="Apollo Clinic" />
        </Field>
        <Field label="Address">
          <input name="address" className="field" placeholder="Sector 17, Vashi" />
        </Field>
        <Field label="Date">
          <input name="date" type="date" required className="field" />
        </Field>
        <Field label="Time">
          <input name="time" type="time" required className="field" />
        </Field>
      </div>
      <Field label="Things to carry" hint="Separate with commas">
        <input name="carry" className="field" defaultValue="Old prescription, Medicine strips, Latest reports" />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-md min-h-12" pendingText="Adding...">
        Add appointment
      </SubmitButton>
    </form>
  );
}

/* --------------------------------- Settings -------------------------------- */

export function EscalationForm({ settings, canEdit }: { settings: EscalationSettings; canEdit: boolean }) {
  const [state, action] = useActionState(saveEscalation, {});
  const step = (
    n: number,
    title: string,
    who: string,
    name: keyof EscalationSettings,
    suffix: string,
    options: number[],
  ) => (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <span
        className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-white"
        aria-hidden
      >
        {n}
      </span>
      <div className="flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-base text-muted">{who}</p>
        <label className="mt-2 inline-flex items-center gap-2 text-base">
          <select name={name} defaultValue={String(settings[name])} disabled={!canEdit} className="field w-auto py-2">
            {options.map((o) => (
              <option key={o} value={o}>
                {o === 0 ? "Off" : `${o} min`}
              </option>
            ))}
          </select>
          <span className="text-muted">{suffix}</span>
        </label>
      </div>
    </li>
  );
  return (
    <form action={action} className="space-y-6">
      <ol className="relative card p-6 before:absolute before:bottom-12 before:left-[2.75rem] before:top-12 before:w-0.5 before:bg-line">
        {step(
          1,
          "Heads-up before the dose",
          "Gentle reminder to the elder",
          "headsUpMin",
          "before dose time",
          [0, 5, 10, 15, 30],
        )}
        <li className="relative flex gap-4 pb-8">
          <span
            className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-white"
            aria-hidden
          >
            2
          </span>
          <div>
            <p className="text-lg font-bold">At dose time</p>
            <p className="text-base text-muted">
              The elder gets &quot;Time for your medicine&quot; with one-tap buttons
            </p>
          </div>
        </li>
        {step(
          3,
          "Tell the primary caretaker",
          'Email with "Mark as taken" and "Snooze" buttons',
          "primaryAfterMin",
          "after dose time",
          [15, 30, 45, 60, 90],
        )}
        {step(
          4,
          "Tell everyone with alerts on",
          "The whole circle, so someone can call or visit",
          "everyoneAfterMin",
          "after dose time",
          [30, 60, 90, 120, 180],
        )}
      </ol>
      <div className="card p-5">
        <label className="flex flex-wrap items-center gap-3 text-base">
          <span className="font-bold">Refill warning</span>
          <select
            name="refillWarnDays"
            defaultValue={String(settings.refillWarnDays)}
            disabled={!canEdit}
            className="field w-auto py-2"
          >
            {[3, 5, 7, 10].map((o) => (
              <option key={o} value={o}>
                {o} days
              </option>
            ))}
          </select>
          <span className="text-muted">before a medicine runs out</span>
        </label>
        <p className="mt-3 text-base text-muted">
          Appointment reminders go out 1 day before and 2 hours before, with Google Calendar and Google Maps links.
        </p>
      </div>
      <Feedback state={state} />
      {canEdit ? (
        <SubmitButton className="btn-primary btn-md min-h-12">Save reminder ladder</SubmitButton>
      ) : (
        <Notice>Only the elder and the primary caretaker can change these.</Notice>
      )}
    </form>
  );
}

/* ------------------------------ Demo / outbox ------------------------------ */

export function ReminderTools() {
  const [runState, runAction] = useActionState(runRemindersNow, {});
  const [testState, testAction] = useActionState(sendTestReminder, {});
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={testAction} className="card space-y-3 p-5">
        <p className="text-lg font-bold">Try a missed-dose email</p>
        <p className="text-base text-muted">
          See exactly what your family receives. Tap &quot;Mark as taken&quot; or &quot;Snooze&quot; right inside the
          email, no login needed.
        </p>
        <label className="block">
          <span className="sr-only">Your email</span>
          <input
            name="email"
            type="email"
            required
            className="field"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <Feedback state={testState} />
        <SubmitButton className="btn-primary btn-md min-h-12" pendingText="Sending...">
          Send sample email
        </SubmitButton>
      </form>
      <form action={runAction} className="card space-y-3 p-5">
        <p className="text-lg font-bold">Check doses now</p>
        <p className="text-base text-muted">
          MedSaathi checks every dose automatically every 5 minutes. Tap to check right away and send any reminders that
          are due.
        </p>
        <Feedback state={runState} />
        <SubmitButton className="btn-outline btn-md min-h-12" pendingText="Checking...">
          Check now
        </SubmitButton>
      </form>
    </div>
  );
}

export function DoctorSummary() {
  const [state, action] = useActionState(makeDoctorSummary, {} as SummaryState);
  return (
    <form action={action} className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold">Summary for the doctor</p>
        <SubmitButton className="btn-primary btn-md" pendingText="Writing...">
          Make doctor summary
        </SubmitButton>
      </div>
      {state.summary ? (
        <div aria-live="polite" className="space-y-2">
          <p className="whitespace-pre-line text-base leading-relaxed">{state.summary}</p>
          <p className="text-sm text-outline">
            {state.source === "gemini"
              ? "Written from the last 30 days of dose records."
              : "Made from the last 30 days of dose records."}
          </p>
          <button type="button" onClick={() => window.print()} className="btn-ghost btn-md">
            Print
          </button>
        </div>
      ) : (
        <p className="text-base text-muted">
          One paragraph covering adherence, missed doses and reasons, plus the family&apos;s questions. Show it at the
          next visit.
        </p>
      )}
    </form>
  );
}
