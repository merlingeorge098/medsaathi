import { describe, expect, it } from "vitest";
import { can, needsElderApproval } from "@/lib/permissions";

describe("care circle permissions", () => {
  it("keeps the elder in charge of approvals and members", () => {
    expect(can("owner", "approveChanges")).toBe(true);
    expect(can("owner", "manageMembers")).toBe(true);
    expect(can("primary", "approveChanges")).toBe(false);
    expect(can("primary", "manageMembers")).toBe(false);
  });

  it("lets editors suggest but not apply medicine changes", () => {
    expect(can("editor", "proposeMedication")).toBe(true);
    expect(can("editor", "applyMedication")).toBe(false);
    expect(needsElderApproval("editor")).toBe(true);
    expect(needsElderApproval("primary")).toBe(true);
    expect(needsElderApproval("owner")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(can("viewer", "view")).toBe(true);
    expect(can("viewer", "logDose")).toBe(false);
    expect(can("viewer", "manageAppointments")).toBe(false);
  });

  it("only lets the primary caretaker and elder change escalation", () => {
    expect(can("primary", "editEscalation")).toBe(true);
    expect(can("editor", "editEscalation")).toBe(false);
  });
});
