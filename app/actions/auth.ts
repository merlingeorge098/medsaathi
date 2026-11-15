"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, newId } from "@/lib/db";
import { DEFAULT_ESCALATION, DEMO_IDS, DEMO_PROFILE_ID, ensureDemo } from "@/lib/demo";
import { endSession, startSession } from "@/lib/session";
import { logActivity } from "@/lib/care";
import type { Member, Profile } from "@/lib/types";

export interface FormState {
  error?: string;
  ok?: string;
}

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const code = z.string().regex(/^\d{6}$/, "Care Code is 6 digits");
const pin = z.string().regex(/^\d{4,6}$/, "Passcode is 4 to 6 digits");

async function profileByCode(careCode: string): Promise<Profile | null> {
  await ensureDemo();
  const store = await db();
  const [profile] = await store.findBy("profiles", "careCode", careCode);
  return profile ?? null;
}

/** Locks a profile for 15 minutes after 5 wrong passcodes, so Care Codes can't be brute forced. */
async function registerFailure(profile: Profile): Promise<string> {
  const store = await db();
  profile.failedAttempts += 1;
  if (profile.failedAttempts >= MAX_ATTEMPTS) {
    profile.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
    profile.failedAttempts = 0;
  }
  await store.put("profiles", profile);
  return profile.lockedUntil
    ? `Too many tries. Please wait ${LOCK_MINUTES} minutes.`
    : "That code and passcode don't match.";
}

function isLocked(profile: Profile): boolean {
  return Boolean(profile.lockedUntil && new Date(profile.lockedUntil) > new Date());
}

const loginSchema = z.object({ careCode: code, email: z.string().trim().toLowerCase().optional(), passcode: pin });

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    careCode: form.get("careCode"),
    email: form.get("email") || undefined,
    passcode: form.get("passcode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { careCode, email, passcode } = parsed.data;

  const profile = await profileByCode(careCode);
  if (!profile) return { error: "That code and passcode don't match." };
  if (isLocked(profile)) return { error: `Too many tries. Please wait ${LOCK_MINUTES} minutes.` };

  const store = await db();
  const members = await store.byProfile("members", profile.id);
  const member = email
    ? members.find((m) => m.email === email && m.role !== "owner")
    : members.find((m) => m.role === "owner");
  if (!member || !(await bcrypt.compare(passcode, member.passcodeHash)))
    return { error: await registerFailure(profile) };
  if (member.status === "pending")
    return { error: `${profile.nickname || profile.name} hasn't approved you yet. Ask them to open MedSaathi.` };
  if (member.status === "declined") return { error: "This request was not approved." };

  profile.failedAttempts = 0;
  await store.put("profiles", profile);
  await store.put("members", { ...member, lastActiveAt: new Date().toISOString() });
  await startSession({ profileId: profile.id, memberId: member.id, role: member.role, name: member.name });
  redirect(member.role === "owner" ? "/elder" : "/circle");
}

export async function demoLogin(form: FormData): Promise<void> {
  await ensureDemo();
  const as = form.get("as") === "elder" ? "elder" : "family";
  if (as === "elder") {
    await startSession({
      profileId: DEMO_PROFILE_ID,
      memberId: DEMO_IDS.owner,
      role: "owner",
      name: "Shantaram Joshi",
    });
    redirect("/elder");
  }
  await startSession({ profileId: DEMO_PROFILE_ID, memberId: DEMO_IDS.primary, role: "primary", name: "Rahul Joshi" });
  redirect("/circle");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}

const joinSchema = z.object({
  careCode: code,
  name: z.string().trim().min(2, "Please enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  relation: z.string().trim().min(2).max(30),
  passcode: pin,
});

export async function joinCircle(_: FormState, form: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  const profile = await profileByCode(data.careCode);
  if (!profile) return { error: "We couldn't find a care circle with that code." };
  if (isLocked(profile)) return { error: `Too many tries. Please wait ${LOCK_MINUTES} minutes.` };

  const store = await db();
  const members = await store.byProfile("members", profile.id);
  if (members.some((m) => m.email === data.email))
    return { error: "This email is already in the circle. Try logging in." };

  const member: Member = {
    id: newId("mem"),
    profileId: profile.id,
    name: data.name,
    email: data.email,
    relation: data.relation,
    role: "viewer",
    status: "pending",
    alerts: false,
    passcodeHash: await bcrypt.hash(data.passcode, 10),
    createdAt: new Date().toISOString(),
  };
  await store.put("members", member);
  await logActivity(profile.id, data.name, "member", `${data.name} (${data.relation}) asked to join the care circle.`);
  return { ok: `Request sent. ${profile.nickname || profile.name} will decide what you can see and do.` };
}

const createSchema = z.object({
  forWhom: z.enum(["self", "other"]),
  elderName: z.string().trim().min(2, "Please enter the name").max(60),
  nickname: z.string().trim().max(20).optional(),
  age: z.coerce.number().int().min(40).max(120),
  phone: z.string().trim().max(20).optional(),
  elderPin: z.string().regex(/^\d{4}$/, "PIN is 4 digits"),
  helperName: z.string().trim().max(60).optional(),
  helperEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  helperPasscode: z
    .string()
    .regex(/^\d{4,6}$/)
    .optional()
    .or(z.literal("")),
  helperRelation: z.string().trim().max(30).optional(),
});

async function uniqueCareCode(): Promise<string> {
  const store = await db();
  for (;;) {
    const candidate = String((crypto.getRandomValues(new Uint32Array(1))[0]! % 900000) + 100000);
    const clash = await store.findBy("profiles", "careCode", candidate);
    if (clash.length === 0) return candidate;
  }
}

export async function createProfile(_: FormState, form: FormData): Promise<FormState> {
  const parsed = createSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (d.forWhom === "other" && (!d.helperName || !d.helperEmail || !d.helperPasscode)) {
    return { error: "Please add your own name, email and a passcode so you can log in as the caretaker." };
  }

  const store = await db();
  const now = new Date().toISOString();
  const pinHash = await bcrypt.hash(d.elderPin, 10);
  const profile: Profile = {
    id: newId("prof"),
    name: d.elderName,
    nickname: d.nickname || d.elderName.split(" ")[0]!,
    age: d.age,
    phone: d.phone,
    allergies: [],
    conditions: [],
    pinHash,
    careCode: await uniqueCareCode(),
    failedAttempts: 0,
    escalation: { ...DEFAULT_ESCALATION },
    createdAt: now,
  };
  await store.put("profiles", profile);
  const owner: Member = {
    id: newId("mem"),
    profileId: profile.id,
    name: d.elderName,
    email: "",
    phone: d.phone,
    relation: "Self",
    role: "owner",
    status: "active",
    alerts: true,
    passcodeHash: pinHash,
    createdAt: now,
  };
  await store.put("members", owner);

  let session = { profileId: profile.id, memberId: owner.id, role: owner.role, name: owner.name };
  if (d.forWhom === "other") {
    const helper: Member = {
      id: newId("mem"),
      profileId: profile.id,
      name: d.helperName!,
      email: d.helperEmail!,
      relation: d.helperRelation || "Family",
      role: "primary",
      status: "active",
      alerts: true,
      passcodeHash: await bcrypt.hash(d.helperPasscode!, 10),
      createdAt: now,
    };
    await store.put("members", helper);
    session = { profileId: profile.id, memberId: helper.id, role: helper.role, name: helper.name };
  }
  await logActivity(profile.id, session.name, "member", `${profile.name}'s care circle was created.`);
  await startSession(session);
  redirect(session.role === "owner" ? "/elder?welcome=1" : "/circle?welcome=1");
}
