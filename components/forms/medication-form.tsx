"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { saveMedication } from "@/app/actions/care";
import { scanPrescription, type ScanState } from "@/app/actions/ai";
import { describeSlots, parsePattern } from "@/lib/prescription";
import type { FoodTiming, Medication } from "@/lib/types";
import { SubmitButton } from "../client";
import { Notice } from "../ui";
import { Feedback, Field } from "./shared";

/* -------------------------------- Medicine -------------------------------- */

export function MedicationForm({
  medication,
  needsApproval,
  elder,
}: {
  medication?: Medication;
  needsApproval: boolean;
  elder: string;
}) {
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
  const effectiveTimes = preview.ok
    ? times.length === preview.slots.length
      ? times
      : preview.slots.map((s) => s.time)
    : [];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {!medication ? (
        <form action={scanAction} className="card space-y-3 border-dashed p-5">
          <p className="flex items-center gap-2 text-lg font-bold">
            <ScanLine className="h-5 w-5 text-primary-soft" aria-hidden /> Scan a prescription
          </p>
          <p className="text-base text-muted">
            Take a photo of the doctor&apos;s prescription. MedSaathi reads the medicines and the 1-0-1 pattern for you.
          </p>
          <label className="flex flex-wrap items-center gap-3">
            <span className="sr-only">Prescription photo</span>
            <input
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="text-base file:mr-3 file:rounded-full file:border-0 file:bg-surface-high file:px-4 file:py-2 file:font-semibold"
            />
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
                      setForm((f) => ({
                        ...f,
                        name: m.name,
                        strength: m.strength,
                        pattern: m.pattern,
                        food: m.food,
                        purpose: m.purpose ?? "",
                      }));
                      setTimes([]);
                    }}
                  >
                    <strong>{m.name}</strong> {m.strength}{" "}
                    <span className="text-muted">
                      {m.pattern}, {m.food} food
                    </span>
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
            <input
              name="name"
              required
              value={form.name}
              onChange={set("name")}
              className="field"
              placeholder="Atorvastatin"
            />
          </Field>
          <Field label="Strength">
            <input
              name="strength"
              value={form.strength}
              onChange={set("strength")}
              className="field"
              placeholder="10 mg"
            />
          </Field>
          <Field label="What it's for" hint="Shown to the elder in simple words">
            <input
              name="purpose"
              value={form.purpose}
              onChange={set("purpose")}
              className="field"
              placeholder="Cholesterol"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shape">
              <select name="shape" value={form.shape} onChange={set("shape")} className="field">
                {["Round", "Oval", "Capsule"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Colour">
              <select name="color" value={form.color} onChange={set("color")} className="field">
                {["White", "Yellow", "Pink", "Orange", "Blue", "Red", "Green", "Brown"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="card space-y-4 bg-surface-low p-5">
          <p className="text-lg font-bold">Dosage</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prescription style" hint="Morning - Afternoon - Night, e.g. 1-0-1">
              <input
                name="pattern"
                required
                value={form.pattern}
                onChange={(e) => {
                  set("pattern")(e);
                  setTimes([]);
                }}
                className="field text-2xl tracking-widest"
                aria-describedby="pattern-preview"
              />
            </Field>
            <fieldset>
              <legend className="label">Food</legend>
              <div className="flex gap-2">
                {(["before", "after", "any"] as const).map((f) => (
                  <label
                    key={f}
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-base ${form.food === f ? "border-primary-soft bg-primary-soft text-white" : "border-line bg-card"}`}
                  >
                    <input
                      type="radio"
                      name="food"
                      value={f}
                      checked={form.food === f}
                      onChange={() => {
                        setForm((s) => ({ ...s, food: f }));
                        setTimes([]);
                      }}
                      className="sr-only"
                    />
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
                  <strong>Schedule:</strong>{" "}
                  {describeSlots(
                    preview.slots.map((s, i) => ({ ...s, time: effectiveTimes[i] ?? s.time })),
                    form.food,
                  )}
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
            <input
              name="stock"
              type="number"
              min={0}
              max={1000}
              value={form.stock}
              onChange={set("stock")}
              className="field"
            />
          </Field>
          {needsApproval ? (
            <Field label={`Note for ${elder}`} hint="Why this change? Shown on the approval screen">
              <input name="note" maxLength={200} className="field" placeholder="Dr. Kulkarni asked to add this" />
            </Field>
          ) : null}
        </div>

        {needsApproval ? (
          <Notice tone="warn">{elder} will be asked to approve this before it changes the schedule.</Notice>
        ) : null}
        <Feedback state={state} />
        <div className="flex flex-wrap gap-3">
          <SubmitButton className="btn-primary btn-md min-h-12 px-6" pendingText="Saving...">
            {needsApproval ? `Save and send to ${elder}` : "Save medicine"}
          </SubmitButton>
          <Link href="/circle/medicines" className="btn-ghost btn-md min-h-12">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
