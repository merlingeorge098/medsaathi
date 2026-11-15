import type { Role } from "./types";

/**
 * Access rules for the care circle. The elder (owner) is always in charge:
 * anyone else can suggest medicine changes, but only the owner can make them final.
 */
export type Action =
  | "view"
  | "logDose"
  | "proposeMedication"
  | "applyMedication"
  | "manageAppointments"
  | "approveChanges"
  | "manageMembers"
  | "editEscalation"
  | "checkIn";

const MATRIX: Record<Role, Action[]> = {
  owner: [
    "view",
    "logDose",
    "proposeMedication",
    "applyMedication",
    "manageAppointments",
    "approveChanges",
    "manageMembers",
    "editEscalation",
    "checkIn",
  ],
  primary: ["view", "logDose", "proposeMedication", "manageAppointments", "editEscalation"],
  editor: ["view", "logDose", "proposeMedication", "manageAppointments"],
  viewer: ["view"],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action);
}

/** Medicine changes by anyone other than the elder become a request the elder must approve. */
export function needsElderApproval(role: Role): boolean {
  return role !== "owner";
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  primary: "Primary caretaker",
  editor: "Can edit",
  viewer: "Can view",
};

export const ROLE_DESCRIPTION: Record<Exclude<Role, "owner">, string> = {
  viewer: "Only see my medicines",
  editor: "See and suggest changes to my medicines",
  primary: "Main caretaker (gets all alerts)",
};
