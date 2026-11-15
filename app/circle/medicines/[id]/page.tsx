import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { elderName, loadProfile } from "@/lib/care";
import { needsElderApproval } from "@/lib/permissions";
import { MedicationForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";

export default async function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession("proposeMedication");
  const med = await (await db()).get("medications", id);
  if (!med || med.profileId !== session.profileId || !med.active) notFound();
  const profile = await loadProfile(session.profileId);
  return (
    <>
      <PageHeader eyebrow="Medicines" title={`Edit ${med.name}`} />
      <MedicationForm medication={med} needsApproval={needsElderApproval(session.role)} elder={elderName(profile)} />
    </>
  );
}
