"use server";

import { z } from "zod";
import { requireSession } from "@/lib/session";
import { loadCareData, elderName } from "@/lib/care";
import { buildAdherence, REASON_LABEL } from "@/lib/adherence";
import { localNow } from "@/lib/time";
import type { SkipReason } from "@/lib/types";

export interface ScanState {
  error?: string;
  medicines?: {
    name: string;
    strength: string;
    pattern: string;
    food: "before" | "after" | "any";
    purpose?: string;
    durationDays?: number | null;
  }[];
}

const MAX_BYTES = 5 * 1024 * 1024;
const allowed = z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function scanPrescription(_: ScanState, form: FormData): Promise<ScanState> {
  await requireSession("proposeMedication");
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo of the prescription first." };
  if (file.size > MAX_BYTES) return { error: "Photo is too large. Please use one under 5 MB." };
  const mime = allowed.safeParse(file.type);
  if (!mime.success) return { error: "Please upload a JPG, PNG or WEBP photo." };

  const { geminiConfigured, readPrescription } = await import("@/lib/gemini");
  if (!geminiConfigured()) return { error: "Prescription scanning isn't available right now." };
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const medicines = await readPrescription(base64, mime.data);
    if (medicines.length === 0) return { error: "Couldn't read any medicines. Try a clearer, well-lit photo." };
    return { medicines };
  } catch (error) {
    console.error("[gemini] scan failed", error);
    return { error: "We couldn't read that photo right now. Please try again." };
  }
}

export interface SummaryState {
  summary?: string;
  source?: "gemini" | "template";
  error?: string;
}

export async function makeDoctorSummary(_prev?: SummaryState): Promise<SummaryState> {
  const session = await requireSession("view");
  const data = await loadCareData(session.profileId);
  const report = buildAdherence(data.medications, data.doseLogs, localNow().date, 30, new Date());
  const name = elderName(data.profile);
  const next = data.appointments.find((a) => new Date(a.at) > new Date());
  const reasons = Object.entries(report.reasons)
    .map(([r, n]) => `${REASON_LABEL[r as SkipReason]} (${n})`)
    .join(", ");

  const facts = [
    `${data.profile.name} (${name}), ${data.profile.age} years. Conditions: ${data.profile.conditions.join(", ") || "not recorded"}.`,
    `Medicines: ${data.medications.map((m) => `${m.name} ${m.strength} ${m.pattern} ${m.food} food`).join("; ")}.`,
    `Last 30 days: ${report.total} doses due, ${report.onTime} on time, ${report.late} late, ${report.missed} missed (${report.onTimePct}% on time).`,
    `Patterns: ${report.patterns.join(" ")}`,
    reasons ? `Reasons given for skipping: ${reasons}.` : "",
    next?.questions.length ? `Family questions: ${next.questions.map((q) => q.text).join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { geminiConfigured, doctorSummary } = await import("@/lib/gemini");
  if (geminiConfigured()) {
    try {
      const summary = await doctorSummary(facts);
      if (summary) return { summary, source: "gemini" };
    } catch (error) {
      console.error("[gemini] summary failed", error);
    }
  }
  const template = `${name} took ${report.onTimePct}% of doses on time in the last 30 days (${report.onTime} on time, ${report.late} late, ${report.missed} missed out of ${report.total}). ${report.patterns.join(" ")}${
    next?.questions.length ? ` Questions from the family: ${next.questions.map((q) => q.text).join(" ")}` : ""
  }`;
  return { summary: template, source: "template" };
}
