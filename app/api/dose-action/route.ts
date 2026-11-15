import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applyDoseAction } from "@/lib/doses";
import { verifyToken } from "@/lib/session";

export const dynamic = "force-dynamic";

interface DoseToken {
  doseId: string;
  action: "taken" | "snooze";
  memberId: string;
}

/**
 * One-tap actions from reminder emails ("He's taken it", "Snooze 15 min").
 * The link carries a signed, 12-hour token, so it works without logging in but can't be forged.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const data = await verifyToken<DoseToken>(token);
  const done = (status: string) => NextResponse.redirect(new URL(`/done?status=${status}`, req.url));
  if (!data?.doseId || !data.memberId) return done("expired");

  const match = /^(.+)_(\d{4}-\d{2}-\d{2})_(\d{2}:\d{2})$/.exec(data.doseId);
  if (!match) return done("expired");
  const [, medicationId, date, time] = match as unknown as [string, string, string, string];

  const store = await db();
  const member = await store.get("members", data.memberId);
  const med = await store.get("medications", medicationId);
  if (!member || !med || member.profileId !== med.profileId || member.status !== "active" || member.role === "viewer") return done("expired");

  await applyDoseAction(med.profileId, member.id, member.name, { medicationId, date, time }, data.action);
  return done(data.action === "taken" ? "taken" : "snoozed");
}
