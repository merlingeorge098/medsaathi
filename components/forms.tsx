"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { createProfile, joinCircle, login, type FormState } from "@/app/actions/auth";
import { createAppointment, runRemindersNow, saveEscalation, saveMedication, sendTestReminder } from "@/app/actions/care";
import { makeDoctorSummary, scanPrescription, type ScanState, type SummaryState } from "@/app/actions/ai";
import { describeSlots, parsePattern } from "@/lib/prescription";
import type { EscalationSettings, FoodTiming, Medication } from "@/lib/types";
import { SubmitButton } from "./client";
import { Notice } from "./ui";

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (state.ok) return <Notice tone="success">{state.ok}</Notice>;
  return null;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-outline">{hint}</span> : null}
    </label>
  );
}

/* ---------------------------------- Login --------------------------------- */

export function LoginForm({ defaultMode = "elder" }: { defaultMode?: "elder" | "family" }) {
  const [state, action] = useActionState(login, {});
  const [mode, setMode] = useState(defaultMode);
  return (
    <form action={action} className="space-y-5">
      <div role="tablist" aria-label="Who is logging in" className="grid grid-cols-2 gap-2 rounded-full bg-surface-high p-1">
        {(["elder", "family"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full py-3 text-base font-semibold ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted"}`}>
            {m === "elder" ? "I'm the elder" : "I'm family / caretaker"}
          </button>
        ))}
      </div>
      <Field label="Care Code" hint="6 digits, shared by the family">
        <input name="careCode" inputMode="numeric" autoComplete="off" pattern="\d{6}" maxLength={6} required className="field text-2xl tracking-[0.4em]" placeholder="482915" />
      </Field>
      {mode === "family" ? (
        <Field label="Your email">
          <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
        </Field>
      ) : null}
      <Field label={mode === "elder" ? "Your 4-digit PIN" : "Your passcode"}>
        <input name="passcode" type="password" inputMode="numeric" autoComplete="current-password" pattern="\d{4,6}" maxLength={6} required className="field text-2xl tracking-[0.4em]" />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Checking...">Log in</SubmitButton>
    </form>
  );
}

/* ---------------------------------- Join ---------------------------------- */

const RELATIONS = ["Son", "Daughter", "Spouse", "Daughter-in-law", "Grandchild", "Caretaker", "Other"];

export function JoinForm() {
  const [state, action] = useActionState(joinCircle, {});
  const [relation, setRelation] = useState("Son");
  if (state.ok) return <Notice tone="success">{state.ok}</Notice>;
  return (
    <form action={action} className="space-y-5">
      <Field label="Care Code">
        <input name="careCode" inputMode="numeric" pattern="\d{6}" maxLength={6} required className="field text-2xl tracking-[0.4em]" placeholder="482915" />
      </Field>
      <Field label="Your name">
        <input name="name" required autoComplete="name" className="field" />
      </Field>
      <Field label="Your email" hint="Missed-dose and appointment alerts come here">
        <input name="email" type="email" required autoComplete="email" className="field" />
      </Field>
      <fieldset>
        <legend className="label">Relationship</legend>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
            <label key={r} className={`cursor-pointer rounded-full border px-4 py-2 text-base ${relation === r ? "border-primary-soft bg-primary-soft text-white" : "border-line bg-card text-ink"}`}>
              <input type="radio" name="relation" value={r} checked={relation === r} onChange={() => setRelation(r)} className="sr-only" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Choose a passcode" hint="4 to 6 digits. You'll use it with the Care Code to log in.">
        <input name="passcode" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} required autoComplete="new-password" className="field" />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Sending...">Send request</SubmitButton>
      <p className="text-center text-base text-muted">The elder will need to approve you before you can see anything.</p>
    </form>
  );
}

/* --------------------------------- Create --------------------------------- */

export function CreateProfileForm({ forWhom }: { forWhom: "self" | "other" }) {
  const [state, action] = useActionState(createProfile, {});
  const other = forWhom === "other";
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="forWhom" value={forWhom} />
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">{other ? "About the person you care for" : "About you"}</legend>
        <Field label="Full name">
          <input name="elderName" required className="field" placeholder="Shantaram Joshi" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="What the family calls them" hint="e.g. Baba, Aai, Nani">
            <input name="nickname" className="field" />
          </Field>
          <Field label="Age">
            <input name="age" type="number" min={40} max={120} required className="field" />
          </Field>
        </div>
        <Field label="Phone number" hint="Shown on emergency screens and alerts">
          <input name="phone" type="tel" autoComplete="tel" className="field" />
        </Field>
        <Field label={other ? "Their 4-digit PIN" : "Choose a 4-digit PIN"} hint="Used on the elder's phone or tablet">
          <input name="elderPin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} required className="field text-2xl tracking-[0.4em]" />
        </Field>
      </fieldset>
      {other ? (
        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="mb-2 text-lg font-bold">About you (main caretaker)</legend>
          <Field label="Your name">
            <input name="helperName" required className="field" />
          </Field>
          <Field label="Your relationship">
            <input name="helperRelation" className="field" placeholder="Son" />
          </Field>
          <Field label="Your email">
            <input name="helperEmail" type="email" required className="field" />
          </Field>
          <Field label="Your passcode" hint="4 to 6 digits">
            <input name="helperPasscode" type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} required className="field" />
          </Field>
        </fieldset>
      ) : null}
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Creating...">Create care circle</SubmitButton>
    </form>
  );
}

/* -------------------------------- Medicine -------------------------------- */

export function MedicationForm({ medication, needsApproval, elder }: { medication?: Medication; needsApproval: boolean; elder: string }) {
  const [state, action] = useActionState(saveMedication, {});
  const [scan, scanAction] = useActionState(scanPrescription, {} as ScanState);
  const [form, setForm] = useState({
    name: medication?.name ?? "",
    strength: medication?.strength ?? "",
    purpose: medication?.purpose ?? "",
    pattern: medication?.pattern ?? "1-0-1",
    food: (medication?.food ?? "after") as FoodTiming,
    shape: medication?.shape ?? "Round",
    color: medication?.color ?? "White",
    stock: String(medication?.stock ?? 30),
  });
  const preview = useMemo(() => parsePattern(form.pattern, form.food), [form.pattern, form.food]);
  const [times, setTimes] = useState<string[]>(medication?.times ?? []);
  const effectiveTimes = preview.ok ? (times.length === preview.slots.length ? times : preview.slots.map((s) => s.time)) : [];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {!medication ? (
        <form action={scanAction} className="card space-y-3 border-dashed p-5">
          <p className="flex items-center gap-2 text-lg font-bold">
            <ScanLine className="h-5 w-5 text-primary-soft" aria-hidden /> Scan a prescription with Gemini
          </p>
          <p className="text-base text-muted">Take a photo of the doctor&apos;s prescription. Gemini reads the medicines and the 1-0-1 pattern for you.</p>
          <label className="flex flex-wrap items-center gap-3">
            <span className="sr-only">Prescription photo</span>
            <input name="photo" type="file" accept="image/*" capture="environment" className="text-base file:mr-3 file:rounded-full file:border-0 file:bg-surface-high file:px-4 file:py-2 file:font-semibold" />
            <SubmitButton className="btn-outline btn-md" pendingText="Reading...">
              <Camera className="h-4 w-4" aria-hidden /> Read prescription
            </SubmitButton>
          </label>
          {scan.error ? <Notice tone="error">{scan.error}</Notice> : null}
          {scan.medicines?.length ? (
            <div className="space-y-2" aria-live="polite">
              <p className="text-base font-semibold">Found {scan.medicines.length}. Tap one to fill the form:</p>
              <div className="flex flex-wrap gap-2">
                {scan.medicines.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rounded-full border border-primary-soft bg-surface-low px-4 py-2 text-left text-base"
                    onClick={() => {
                      setForm((f) => ({ ...f, name: m.name, strength: m.strength, pattern: m.pattern, food: m.food, purpose: m.purpose ?? "" }));
                      setTimes([]);
                    }}
                  >
                    <strong>{m.name}</strong> {m.strength} <span className="text-muted">{m.pattern}, {m.food} food</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      ) : null}

      <form action={action} className="space-y-5">
        {medication ? <input type="hidden" name="id" value={medication.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Medicine name">
            <input name="name" required value={form.name} onChange={set("name")} className="field" placeholder="Atorvastatin" />
          </Field>
          <Field label="Strength">
            <input name="strength" value={form.strength} onChange={set("strength")} className="field" placeholder="10 mg" />
          </Field>
          <Field label="What it's for" hint="Shown to the elder in simple words">
            <input name="purpose" value={form.purpose} onChange={set("purpose")} className="field" placeholder="Cholesterol" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shape">
              <select name="shape" value={form.shape} onChange={set("shape")} className="field">
                {["Round", "Oval", "Capsule"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Colour">
              <select name="color" value={form.color} onChange={set("color")} className="field">
                {["White", "Yellow", "Pink", "Orange", "Blue", "Red", "Green", "Brown"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="card space-y-4 bg-surface-low p-5">
          <p className="text-lg font-bold">Dosage</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prescription style" hint="Morning - Afternoon - Night, e.g. 1-0-1">
              <input name="pattern" required value={form.pattern} onChange={(e) => { set("pattern")(e); setTimes([]); }} className="field text-2xl tracking-widest" aria-describedby="pattern-preview" />
            </Field>
            <fieldset>
              <legend className="label">Food</legend>
              <div className="flex gap-2">
                {(["before", "after", "any"] as const).map((f) => (
                  <label key={f} className={`cursor-pointer rounded-full border px-4 py-2.5 text-base ${form.food === f ? "border-primary-soft bg-primary-soft text-white" : "border-line bg-card"}`}>
                    <input type="radio" name="food" value={f} checked={form.food === f} onChange={() => { setForm((s) => ({ ...s, food: f })); setTimes([]); }} className="sr-only" />
                    {f === "any" ? "Any time" : `${f[0]!.toUpperCase()}${f.slice(1)} food`}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div id="pattern-preview" aria-live="polite">
            {preview.ok ? (
              <div className="space-y-3">
                <p className="text-base text-primary">
                  <strong>Schedule:</strong> {describeSlots(preview.slots.map((s, i) => ({ ...s, time: effectiveTimes[i] ?? s.time })), form.food)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {preview.slots.map((s, i) => (
                    <label key={s.slot} className="text-sm">
                      <span className="label capitalize">{s.slot} time</span>
                      <input
                        type="time"
                        value={effectiveTimes[i]}
                        onChange={(e) => {
                          const next = [...effectiveTimes];
                          next[i] = e.target.value;
                          setTimes(next);
                        }}
                        className="field w-36"
                      />
                    </label>
                  ))}
                </div>
                <input type="hidden" name="times" value={effectiveTimes.join(",")} />
              </div>
            ) : (
              <p className="text-base text-missed">{preview.error}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tablets in hand" hint="We warn the family before it runs out">
            <input name="stock" type="number" min={0} max={1000} value={form.stock} onChange={set("stock")} className="field" />
          </Field>
          {needsApproval ? (
            <Field label={`Note for ${elder}`} hint="Why this change? Shown on the approval screen">
              <input name="note" maxLength={200} className="field" placeholder="Dr. Kulkarni asked to add this" />
            </Field>
          ) : null}
        </div>

        {needsApproval ? <Notice tone="warn">{elder} will be asked to approve this before it changes the schedule.</Notice> : null}
        <Feedback state={state} />
        <div className="flex flex-wrap gap-3">
          <SubmitButton className="btn-primary btn-md min-h-12 px-6" pendingText="Saving...">
            {needsApproval ? `Save and send to ${elder}` : "Save medicine"}
          </SubmitButton>
          <Link href="/circle/medicines" className="btn-ghost btn-md min-h-12">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------- Appointments ------------------------------ */

export function AppointmentForm() {
  const [state, action] = useActionState(createAppointment, {});
  return (
    <form action={action} className="card space-y-4 p-5">
      <p className="text-lg font-bold">Add an appointment</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Doctor"><input name="doctor" required className="field" placeholder="Dr. Anjali Kulkarni" /></Field>
        <Field label="Speciality"><input name="specialty" className="field" placeholder="Cardiologist" /></Field>
        <Field label="Clinic or hospital"><input name="clinic" required className="field" placeholder="Apollo Clinic" /></Field>
        <Field label="Address"><input name="address" className="field" placeholder="Sector 17, Vashi" /></Field>
        <Field label="Date"><input name="date" type="date" required className="field" /></Field>
        <Field label="Time"><input name="time" type="time" required className="field" /></Field>
      </div>
      <Field label="Things to carry" hint="Separate with commas">
        <input name="carry" className="field" defaultValue="Old prescription, Medicine strips, Latest reports" />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-md min-h-12" pendingText="Adding...">Add appointment</SubmitButton>
    </form>
  );
}

/* --------------------------------- Settings -------------------------------- */

export function EscalationForm({ settings, canEdit }: { settings: EscalationSettings; canEdit: boolean }) {
  const [state, action] = useActionState(saveEscalation, {});
  const step = (n: number, title: string, who: string, name: keyof EscalationSettings, suffix: string, options: number[]) => (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-white" aria-hidden>{n}</span>
      <div className="flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-base text-muted">{who}</p>
        <label className="mt-2 inline-flex items-center gap-2 text-base">
          <select name={name} defaultValue={String(settings[name])} disabled={!canEdit} className="field w-auto py-2">
            {options.map((o) => <option key={o} value={o}>{o === 0 ? "Off" : `${o} min`}</option>)}
          </select>
          <span className="text-muted">{suffix}</span>
        </label>
      </div>
    </li>
  );
  return (
    <form action={action} className="space-y-6">
      <ol className="relative card p-6 before:absolute before:bottom-12 before:left-[2.75rem] before:top-12 before:w-0.5 before:bg-line">
        {step(1, "Heads-up before the dose", "Gentle reminder to the elder", "headsUpMin", "before dose time", [0, 5, 10, 15, 30])}
        <li className="relative flex gap-4 pb-8">
          <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-white" aria-hidden>2</span>
          <div>
            <p className="text-lg font-bold">At dose time</p>
            <p className="text-base text-muted">The elder gets &quot;Time for your medicine&quot; with one-tap buttons</p>
          </div>
        </li>
        {step(3, "Tell the primary caretaker", "Email with \"Mark as taken\" and \"Snooze\" buttons", "primaryAfterMin", "after dose time", [15, 30, 45, 60, 90])}
        {step(4, "Tell everyone with alerts on", "The whole circle, so someone can call or visit", "everyoneAfterMin", "after dose time", [30, 60, 90, 120, 180])}
      </ol>
      <div className="card p-5">
        <label className="flex flex-wrap items-center gap-3 text-base">
          <span className="font-bold">Refill warning</span>
          <select name="refillWarnDays" defaultValue={String(settings.refillWarnDays)} disabled={!canEdit} className="field w-auto py-2">
            {[3, 5, 7, 10].map((o) => <option key={o} value={o}>{o} days</option>)}
          </select>
          <span className="text-muted">before a medicine runs out</span>
        </label>
        <p className="mt-3 text-base text-muted">Appointment reminders go out 1 day before and 2 hours before, with Google Calendar and Google Maps links.</p>
      </div>
      <Feedback state={state} />
      {canEdit ? <SubmitButton className="btn-primary btn-md min-h-12">Save reminder ladder</SubmitButton> : <Notice>Only the elder and the primary caretaker can change these.</Notice>}
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
        <p className="text-base text-muted">See exactly what your family receives. Tap &quot;Mark as taken&quot; or &quot;Snooze&quot; right inside the email, no login needed.</p>
        <label className="block">
          <span className="sr-only">Your email</span>
          <input name="email" type="email" required className="field" placeholder="you@example.com" autoComplete="email" />
        </label>
        <Feedback state={testState} />
        <SubmitButton className="btn-primary btn-md min-h-12" pendingText="Sending...">Send sample email</SubmitButton>
      </form>
      <form action={runAction} className="card space-y-3 p-5">
        <p className="text-lg font-bold">Check doses now</p>
        <p className="text-base text-muted">MedSaathi checks every dose automatically every 5 minutes. Tap to check right away and send any reminders that are due.</p>
        <Feedback state={runState} />
        <SubmitButton className="btn-outline btn-md min-h-12" pendingText="Checking...">Check now</SubmitButton>
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
        <SubmitButton className="btn-primary btn-md" pendingText="Writing...">Make doctor summary</SubmitButton>
      </div>
      {state.summary ? (
        <div aria-live="polite" className="space-y-2">
          <p className="whitespace-pre-line text-base leading-relaxed">{state.summary}</p>
          <p className="text-sm text-outline">{state.source === "gemini" ? "Written by Gemini from the last 30 days of dose records." : "Generated from the last 30 days of dose records. Add a Gemini key for a written summary."}</p>
          <button type="button" onClick={() => window.print()} className="btn-ghost btn-md">Print</button>
        </div>
      ) : (
        <p className="text-base text-muted">One paragraph covering adherence, missed doses and reasons, plus the family&apos;s questions. Show it at the next visit.</p>
      )}
    </form>
  );
}
