import "server-only";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type {
  Activity,
  Appointment,
  ChangeRequest,
  CheckIn,
  DoseLog,
  Medication,
  Member,
  OutboxEmail,
  Profile,
} from "./types";

/**
 * Storage layer. Uses Cloud Firestore when Firebase credentials are configured and falls back
 * to an in-memory store otherwise, so the app runs instantly for local development and demos.
 * All reads are scoped by profileId and only ever happen on the server: the Firestore security
 * rules deny every client request (see firestore.rules).
 */
export interface Collections {
  profiles: Profile;
  members: Member;
  medications: Medication;
  doseLogs: DoseLog;
  changeRequests: ChangeRequest;
  appointments: Appointment;
  activity: Activity;
  checkIns: CheckIn;
  outbox: OutboxEmail;
}
export type CollectionName = keyof Collections;

export interface Store {
  get<C extends CollectionName>(col: C, id: string): Promise<Collections[C] | null>;
  put<C extends CollectionName>(col: C, doc: Collections[C] & { id: string }): Promise<void>;
  remove(col: CollectionName, id: string): Promise<void>;
  byProfile<C extends CollectionName>(col: C, profileId: string): Promise<Collections[C][]>;
  findBy<C extends CollectionName>(col: C, field: string, value: string): Promise<Collections[C][]>;
  all<C extends CollectionName>(col: C): Promise<Collections[C][]>;
}

class MemoryStore implements Store {
  private data = new Map<string, Map<string, unknown>>();

  private table(col: CollectionName) {
    let t = this.data.get(col);
    if (!t) {
      t = new Map();
      this.data.set(col, t);
    }
    return t;
  }
  async get<C extends CollectionName>(col: C, id: string) {
    const doc = this.table(col).get(id);
    return doc ? (structuredClone(doc) as Collections[C]) : null;
  }
  async put<C extends CollectionName>(col: C, doc: Collections[C] & { id: string }) {
    this.table(col).set(doc.id, structuredClone(doc));
  }
  async remove(col: CollectionName, id: string) {
    this.table(col).delete(id);
  }
  async byProfile<C extends CollectionName>(col: C, profileId: string) {
    return this.findBy(col, "profileId", profileId);
  }
  async findBy<C extends CollectionName>(col: C, field: string, value: string) {
    return [...this.table(col).values()]
      .filter((d) => (d as Record<string, unknown>)[field] === value)
      .map((d) => structuredClone(d) as Collections[C]);
  }
  async all<C extends CollectionName>(col: C) {
    return [...this.table(col).values()].map((d) => structuredClone(d) as Collections[C]);
  }
}

/** Firestore rejects `undefined` values, so strip them before writing. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class FirestoreStore implements Store {
  constructor(private db: Firestore) {}
  async get<C extends CollectionName>(col: C, id: string) {
    const snap = await this.db.collection(col).doc(id).get();
    return snap.exists ? (snap.data() as Collections[C]) : null;
  }
  async put<C extends CollectionName>(col: C, doc: Collections[C] & { id: string }) {
    await this.db.collection(col).doc(doc.id).set(clean(doc));
  }
  async remove(col: CollectionName, id: string) {
    await this.db.collection(col).doc(id).delete();
  }
  async byProfile<C extends CollectionName>(col: C, profileId: string) {
    return this.findBy(col, "profileId", profileId);
  }
  async findBy<C extends CollectionName>(col: C, field: string, value: string) {
    const snap = await this.db.collection(col).where(field, "==", value).get();
    return snap.docs.map((d) => d.data() as Collections[C]);
  }
  async all<C extends CollectionName>(col: C) {
    const snap = await this.db.collection(col).get();
    return snap.docs.map((d) => d.data() as Collections[C]);
  }
}

const globalForStore = globalThis as unknown as { __medsaathiStore?: Store };

export function usingFirestore(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

async function createFirestore(): Promise<Store> {
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app: App =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  return new FirestoreStore(getFirestore(app));
}

export async function db(): Promise<Store> {
  if (!globalForStore.__medsaathiStore) {
    globalForStore.__medsaathiStore = usingFirestore() ? await createFirestore() : new MemoryStore();
  }
  return globalForStore.__medsaathiStore;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
