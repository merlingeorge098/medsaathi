import "server-only";
import { cache } from "react";
import { db, newId } from "./db";
import { ensureDemo } from "./demo";
import type { Activity, Member, Profile } from "./types";
import { firstName } from "./format";

export { firstName, initials } from "./format";

export const loadProfile = cache(async (profileId: string): Promise<Profile> => {
  await ensureDemo();
  const store = await db();
  const profile = await store.get("profiles", profileId);
  if (!profile) throw new Error("Profile not found");
  return profile;
});

export const loadMembers = cache(async (profileId: string): Promise<Member[]> => {
  const store = await db();
  const members = await store.byProfile("members", profileId);
  const order = { owner: 0, primary: 1, editor: 2, viewer: 3 } as const;
  return members.sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));
});

export async function loadCareData(profileId: string) {
  const store = await db();
  const [profile, members, medications, doseLogs, changeRequests, appointments, activity, checkIns] = await Promise.all(
    [
      loadProfile(profileId),
      loadMembers(profileId),
      store.byProfile("medications", profileId),
      store.byProfile("doseLogs", profileId),
      store.byProfile("changeRequests", profileId),
      store.byProfile("appointments", profileId),
      store.byProfile("activity", profileId),
      store.byProfile("checkIns", profileId),
    ],
  );
  return {
    profile,
    members,
    medications: medications.filter((m) => m.active).sort((a, b) => (a.times[0] ?? "").localeCompare(b.times[0] ?? "")),
    doseLogs,
    changeRequests: changeRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    appointments: appointments.sort((a, b) => a.at.localeCompare(b.at)),
    activity: activity.sort((a, b) => b.at.localeCompare(a.at)),
    checkIns: checkIns.sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export async function logActivity(
  profileId: string,
  actor: string,
  kind: Activity["kind"],
  text: string,
): Promise<void> {
  const store = await db();
  await store.put("activity", { id: newId("act"), profileId, actor, kind, text, at: new Date().toISOString() });
}

/** How the circle refers to the elder in copy, e.g. "Baba". */
export function elderName(profile: Profile): string {
  return profile.nickname || firstName(profile.name);
}
