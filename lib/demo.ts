import "server-only";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { doseId } from "./adherence";
import { addDays, istInstant, localNow, toMinutes } from "./time";
import type { Activity, Appointment, ChangeRequest, DoseLog, Medication, Member, Profile, SkipReason } from "./types";

/**
 * Demo care circle so judges land on a lived-in profile: Shantaram Joshi ("Baba"), 76, and his family.
 * Care Code 482915, Baba's PIN 1234. Family members use passcode 2468.
 */
export const DEMO_PROFILE_ID = "demo_baba";
export const DEMO_CARE_CODE = "482915";
export const DEMO_PIN = "1234";
export const DEMO_PASSCODE = "2468";
export const DEMO_IDS = { owner: "demo_m_baba", primary: "demo_m_rahul" } as const;

export const DEFAULT_ESCALATION = {
  headsUpMin: 10,
  primaryAfterMin: 30,
  everyoneAfterMin: 60,
  appointmentReminderHours: [24, 2],
  refillWarnDays: 5,
};

/** Small deterministic PRNG so the demo history looks the same on every deploy. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export async function ensureDemo(): Promise<void> {
  const store = await db();
  if (await store.get("profiles", DEMO_PROFILE_ID)) return;
  await seedDemo();
}

export async function seedDemo(): Promise<void> {
  const store = await db();
  const now = new Date();
  const today = localNow(now).date;
  const created = istInstant(addDays(today, -40), "09:00").toISOString();
  const [pinHash, passHash] = await Promise.all([bcrypt.hash(DEMO_PIN, 10), bcrypt.hash(DEMO_PASSCODE, 10)]);

  const profile: Profile = {
    id: DEMO_PROFILE_ID,
    name: "Shantaram Joshi",
    nickname: "Baba",
    age: 76,
    phone: "+91 98200 11223",
    bloodGroup: "B+",
    allergies: ["Penicillin"],
    conditions: ["Type 2 diabetes", "Hypertension"],
    pinHash,
    careCode: DEMO_CARE_CODE,
    failedAttempts: 0,
    escalation: { ...DEFAULT_ESCALATION },
    createdAt: created,
  };
  await store.put("profiles", profile);

  const member = (
    id: string,
    name: string,
    relation: string,
    role: Member["role"],
    email: string,
    phone: string,
    status: Member["status"] = "active",
  ): Member => ({
    id,
    profileId: DEMO_PROFILE_ID,
    name,
    email,
    phone,
    relation,
    role,
    status,
    alerts: role === "primary" || role === "editor",
    passcodeHash: role === "owner" ? pinHash : passHash,
    createdAt: created,
    lastActiveAt: now.toISOString(),
  });
  const members = [
    member(DEMO_IDS.owner, "Shantaram Joshi", "Self", "owner", "", "+91 98200 11223"),
    member(DEMO_IDS.primary, "Rahul Joshi", "Son", "primary", "rahul.demo@medsaathi.app", "+91 98200 44556"),
    member("demo_m_priya", "Priya Joshi", "Daughter-in-law", "editor", "priya.demo@medsaathi.app", "+91 98200 77889"),
    member("demo_m_sunita", "Sunita Pawar", "Home nurse", "editor", "sunita.demo@medsaathi.app", "+91 98200 22334"),
    member("demo_m_ankit", "Ankit Joshi", "Grandson", "viewer", "ankit.demo@medsaathi.app", "+91 98200 99001"),
    member(
      "demo_m_mehta",
      "Dr. Mehta's Clinic",
      "Clinic",
      "viewer",
      "clinic.demo@medsaathi.app",
      "+91 22 2765 1100",
      "pending",
    ),
  ];
  for (const m of members) await store.put("members", m);

  const med = (
    id: string,
    name: string,
    strength: string,
    purpose: string,
    shape: string,
    color: string,
    pattern: string,
    times: string[],
    stock: number,
  ): Medication => ({
    id,
    profileId: DEMO_PROFILE_ID,
    name,
    strength,
    purpose,
    shape,
    color,
    pattern,
    food: "after",
    times,
    dosePerTime: 1,
    stock,
    active: true,
    createdAt: created,
  });
  const meds = [
    med("demo_med_metformin", "Metformin", "500 mg", "Blood sugar", "Round", "White", "1-0-0", ["08:30"], 42),
    med("demo_med_amlodipine", "Amlodipine", "5 mg", "Blood pressure", "Round", "Yellow", "0-1-0", ["14:00"], 24),
    med("demo_med_atorvastatin", "Atorvastatin", "10 mg", "Cholesterol", "Oval", "White", "0-0-1", ["21:00"], 30),
    med("demo_med_ecosprin", "Ecosprin", "75 mg", "Heart care", "Round", "Pink", "0-0-1", ["21:00"], 5),
  ];
  for (const m of meds) await store.put("medications", m);

  // 30 days of history. Afternoon doses are missed more often, mostly because Baba felt unwell.
  const rand = rng(76);
  const nowMins = localNow(now).minutes;
  for (let d = 30; d >= 0; d--) {
    const date = addDays(today, -d);
    for (const m of meds) {
      for (const time of m.times) {
        if (d === 0 && toMinutes(time) + 45 > nowMins) continue;
        const roll = rand();
        const afternoon = time === "14:00";
        const missChance = afternoon ? 0.22 : 0.05;
        const lateChance = 0.08;
        const id = doseId(m.id, date, time);
        let log: DoseLog;
        if (roll < missChance) {
          const reasons: SkipReason[] = afternoon
            ? ["unwell", "unwell", "forgot", "side_effects"]
            : ["forgot", "unwell"];
          const skipped = rand() < 0.7;
          log = {
            id,
            profileId: DEMO_PROFILE_ID,
            medicationId: m.id,
            date,
            time,
            status: skipped ? "skipped" : undefined,
            reason: skipped ? reasons[Math.floor(rand() * reasons.length)] : undefined,
            actedAt: skipped ? istInstant(date, time).toISOString() : undefined,
            actedBy: skipped ? DEMO_IDS.owner : undefined,
            notified: { due: true, primary: true, everyone: !skipped, skip: skipped },
          };
        } else {
          const delay = roll < missChance + lateChance ? 70 + Math.floor(rand() * 60) : Math.floor(rand() * 25);
          log = {
            id,
            profileId: DEMO_PROFILE_ID,
            medicationId: m.id,
            date,
            time,
            status: "taken",
            actedAt: new Date(istInstant(date, time).getTime() + delay * 60000).toISOString(),
            actedBy: rand() < 0.85 ? DEMO_IDS.owner : "demo_m_sunita",
            notified: { due: true },
          };
        }
        await store.put("doseLogs", log);
      }
    }
  }

  const change: ChangeRequest = {
    id: "demo_cr_amlodipine",
    profileId: DEMO_PROFILE_ID,
    kind: "update_medication",
    medicationId: "demo_med_amlodipine",
    before: { times: ["14:00"], pattern: "0-1-0" },
    after: { times: ["21:00"], pattern: "0-0-1" },
    note: "Dr. Kulkarni said night is better for BP and might stop the afternoon dizziness.",
    requestedBy: DEMO_IDS.primary,
    requestedByName: "Rahul Joshi",
    status: "pending",
    createdAt: new Date(now.getTime() - 50 * 60000).toISOString(),
  };
  await store.put("changeRequests", change);

  const nextVisitDate = addDays(today, 2);
  const appointment: Appointment = {
    id: "demo_appt_kulkarni",
    profileId: DEMO_PROFILE_ID,
    doctor: "Dr. Anjali Kulkarni",
    specialty: "Cardiologist",
    clinic: "Apollo Clinic",
    address: "Sector 17, Vashi, Navi Mumbai",
    at: istInstant(nextVisitDate, "11:30").toISOString(),
    escortMemberId: "demo_m_priya",
    carry: [
      { label: "Old prescription", done: true },
      { label: "Last BP readings", done: false },
      { label: "All medicine strips", done: false },
      { label: "Aadhaar card", done: false },
    ],
    questions: [
      { text: "Can the BP tablet move to night? Afternoons make him dizzy.", by: "Rahul Joshi" },
      { text: "Is Ecosprin still needed every day?", by: "Priya Joshi" },
    ],
    notified: {},
    createdAt: created,
  };
  await store.put("appointments", appointment);
  await store.put("appointments", {
    ...appointment,
    id: "demo_appt_diabetes",
    doctor: "Dr. Suresh Nair",
    specialty: "Diabetologist",
    clinic: "Fortis Hiranandani",
    address: "Juhu Nagar, Vashi, Navi Mumbai",
    at: istInstant(addDays(today, 16), "10:00").toISOString(),
    escortMemberId: undefined,
    carry: [{ label: "HbA1c report", done: false }],
    questions: [],
  });

  const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
  const activity: Omit<Activity, "id" | "profileId">[] = [
    {
      actor: "Rahul Joshi",
      kind: "medicine",
      text: "Rahul asked to move Amlodipine from 2:00 PM to 9:00 PM. Waiting for Baba.",
      at: minsAgo(50),
    },
    { actor: "Shantaram Joshi", kind: "checkin", text: "Baba checked in: feeling okay.", at: minsAgo(140) },
    {
      actor: "Sunita Pawar",
      kind: "dose",
      text: "Sunita marked Metformin as taken on Baba's behalf.",
      at: minsAgo(200),
    },
    { actor: "Priya Joshi", kind: "appointment", text: "Priya will take Baba to Dr. Kulkarni.", at: minsAgo(60 * 20) },
    {
      actor: "Priya Joshi",
      kind: "appointment",
      text: "Priya added a question for Dr. Kulkarni.",
      at: minsAgo(60 * 21),
    },
    { actor: "Shantaram Joshi", kind: "member", text: "Baba approved Sunita Pawar as Can edit.", at: minsAgo(60 * 48) },
  ];
  for (const [i, a] of activity.entries())
    await store.put("activity", { id: `demo_act_${i}`, profileId: DEMO_PROFILE_ID, ...a });

  await store.put("checkIns", {
    id: "demo_ci_today",
    profileId: DEMO_PROFILE_ID,
    mood: "okay",
    note: "Thoda thakan hai, baaki theek hai.",
    at: minsAgo(140),
  });
}
