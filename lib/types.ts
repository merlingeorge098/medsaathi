/** Core domain types for MedSaathi. Every record belongs to exactly one elder profile. */

export type Role = "owner" | "primary" | "editor" | "viewer";
export type MemberStatus = "pending" | "active" | "declined";
export type FoodTiming = "before" | "after" | "any";
export type Slot = "morning" | "afternoon" | "evening" | "night";
export type DoseStatus = "taken" | "skipped" | "snoozed";
export type SkipReason = "forgot" | "unwell" | "finished" | "side_effects" | "other";
export type Mood = "good" | "okay" | "unwell";

export interface EscalationSettings {
  /** Minutes before a dose to send a heads-up to the elder. 0 disables it. */
  headsUpMin: number;
  /** Minutes after the dose time before the primary caretaker is emailed. */
  primaryAfterMin: number;
  /** Minutes after the dose time before everyone with alerts on is emailed. */
  everyoneAfterMin: number;
  /** Hours before an appointment to send reminders. */
  appointmentReminderHours: number[];
  refillWarnDays: number;
}

export interface Profile {
  id: string;
  name: string;
  nickname: string;
  age: number;
  email?: string;
  phone?: string;
  bloodGroup?: string;
  allergies: string[];
  conditions: string[];
  pinHash: string;
  careCode: string;
  failedAttempts: number;
  lockedUntil?: string;
  escalation: EscalationSettings;
  createdAt: string;
}

export interface Member {
  id: string;
  profileId: string;
  name: string;
  email: string;
  phone?: string;
  relation: string;
  role: Role;
  status: MemberStatus;
  alerts: boolean;
  passcodeHash: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  strength: string;
  purpose?: string;
  shape?: string;
  color?: string;
  pattern: string;
  food: FoodTiming;
  times: string[];
  dosePerTime: number;
  stock: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface DoseLog {
  /** Deterministic id: `${medicationId}_${date}_${time}` */
  id: string;
  profileId: string;
  medicationId: string;
  date: string;
  time: string;
  status?: DoseStatus;
  actedAt?: string;
  actedBy?: string;
  reason?: SkipReason;
  snoozeUntil?: string;
  notified: { headsUp?: boolean; due?: boolean; primary?: boolean; everyone?: boolean; skip?: boolean };
}

export type ChangeKind = "add_medication" | "update_medication" | "remove_medication";

export interface ChangeRequest {
  id: string;
  profileId: string;
  kind: ChangeKind;
  medicationId?: string;
  before?: Partial<Medication>;
  after?: Partial<Medication>;
  note?: string;
  requestedBy: string;
  requestedByName: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  decidedAt?: string;
}

export interface Appointment {
  id: string;
  profileId: string;
  doctor: string;
  specialty: string;
  clinic: string;
  address: string;
  at: string;
  escortMemberId?: string;
  carry: { label: string; done: boolean }[];
  questions: { text: string; by: string }[];
  notified: Record<string, boolean>;
  createdAt: string;
}

export interface Activity {
  id: string;
  profileId: string;
  actor: string;
  kind: "medicine" | "dose" | "appointment" | "member" | "checkin" | "settings";
  text: string;
  at: string;
}

export interface CheckIn {
  id: string;
  profileId: string;
  mood: Mood;
  note?: string;
  at: string;
}

export interface OutboxEmail {
  id: string;
  profileId: string;
  to: string;
  subject: string;
  html: string;
  kind: string;
  delivered: boolean;
  at: string;
}

export interface Session {
  profileId: string;
  memberId: string;
  role: Role;
  name: string;
}
