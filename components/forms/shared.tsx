"use client";

import { type FormState } from "@/app/actions/auth";
import { Notice } from "../ui";

export function Feedback({ state }: { state: FormState }) {
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (state.ok) return <Notice tone="success">{state.ok}</Notice>;
  return null;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-outline">{hint}</span> : null}
    </label>
  );
}
