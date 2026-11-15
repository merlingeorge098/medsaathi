"use client";

import { useActionState, useState } from "react";
import { createProfile, joinCircle, login } from "@/app/actions/auth";
import { SubmitButton } from "../client";
import { Notice } from "../ui";
import { Feedback, Field } from "./shared";

/* ---------------------------------- Login --------------------------------- */

export function LoginForm({ defaultMode = "elder" }: { defaultMode?: "elder" | "family" }) {
  const [state, action] = useActionState(login, {});
  const [mode, setMode] = useState(defaultMode);
  return (
    <form action={action} className="space-y-5">
      <div
        role="tablist"
        aria-label="Who is logging in"
        className="grid grid-cols-2 gap-2 rounded-full bg-surface-high p-1"
      >
        {(["elder", "family"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full py-3 text-base font-semibold ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted"}`}
          >
            {m === "elder" ? "I'm the elder" : "I'm family / caretaker"}
          </button>
        ))}
      </div>
      <Field label="Care Code" hint="6 digits, shared by the family">
        <input
          name="careCode"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{6}"
          maxLength={6}
          required
          className="field text-2xl tracking-[0.4em]"
          placeholder="482915"
        />
      </Field>
      {mode === "family" ? (
        <Field label="Your email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            placeholder="you@example.com"
          />
        </Field>
      ) : null}
      <Field label={mode === "elder" ? "Your 4-digit PIN" : "Your passcode"}>
        <input
          name="passcode"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{4,6}"
          maxLength={6}
          required
          className="field text-2xl tracking-[0.4em]"
        />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Checking...">
        Log in
      </SubmitButton>
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
        <input
          name="careCode"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          className="field text-2xl tracking-[0.4em]"
          placeholder="482915"
        />
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
            <label
              key={r}
              className={`cursor-pointer rounded-full border px-4 py-2 text-base ${relation === r ? "border-primary-soft bg-primary-soft text-white" : "border-line bg-card text-ink"}`}
            >
              <input
                type="radio"
                name="relation"
                value={r}
                checked={relation === r}
                onChange={() => setRelation(r)}
                className="sr-only"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Choose a passcode" hint="4 to 6 digits. You'll use it with the Care Code to log in.">
        <input
          name="passcode"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          required
          autoComplete="new-password"
          className="field"
        />
      </Field>
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Sending...">
        Send request
      </SubmitButton>
      <p className="text-center text-base text-muted">
        The elder will need to approve you before you can see anything.
      </p>
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
          <input
            name="elderPin"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            className="field text-2xl tracking-[0.4em]"
          />
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
            <input
              name="helperPasscode"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              required
              className="field"
            />
          </Field>
        </fieldset>
      ) : null}
      <Feedback state={state} />
      <SubmitButton className="btn-primary btn-elder" pendingText="Creating...">
        Create care circle
      </SubmitButton>
    </form>
  );
}
