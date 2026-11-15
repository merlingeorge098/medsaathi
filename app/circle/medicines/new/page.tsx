import { requireSession } from "@/lib/session";
import { elderName, loadProfile } from "@/lib/care";
import { needsElderApproval } from "@/lib/permissions";
import { MedicationForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";

export default async function NewMedicinePage() {
  const session = await requireSession("proposeMedication");
  const profile = await loadProfile(session.profileId);
  return (
    <>
      <PageHeader eyebrow="Medicines" title="Add medicine" />
      <MedicationForm needsApproval={needsElderApproval(session.role)} elder={elderName(profile)} />
    </>
  );
}
