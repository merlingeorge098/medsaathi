import { Phone } from "lucide-react";
import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { formatTime } from "@/lib/time";
import { PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/client";

export default async function EmergencyPage() {
  const session = await requireSession();
  const { profile, medications, members, appointments } = await loadCareData(session.profileId);
  const contacts = members.filter(
    (m) => m.status === "active" && m.role !== "owner" && m.phone && (m.role === "primary" || m.role === "editor"),
  );
  const doctor = appointments[0];
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-t border-line py-3">
      <p className="eyebrow text-muted">{label}</p>
      <div className="mt-1 text-lg">{children}</div>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Emergency card"
        title="Show this to paramedics"
        actions={<PrintButton label="Print card" />}
      />
      <article className="card mx-auto max-w-2xl bg-white p-6" aria-label="Emergency medical information">
        <h2 className="text-3xl font-bold">{profile.name}</h2>
        <p className="text-xl">
          {profile.age} years{profile.bloodGroup ? `, blood group ${profile.bloodGroup}` : ""}
        </p>
        <Row label="Allergies">
          <strong className="text-missed">{profile.allergies.join(", ") || "None recorded"}</strong>
        </Row>
        <Row label="Conditions">{profile.conditions.join(", ") || "None recorded"}</Row>
        <Row label="Current medicines">
          <ul>
            {medications.map((m) => (
              <li key={m.id}>
                {m.name} {m.strength}, {m.times.map(formatTime).join(" and ")}
              </li>
            ))}
          </ul>
        </Row>
        {doctor ? (
          <Row label="Doctor">
            {doctor.doctor}, {doctor.clinic}
          </Row>
        ) : null}
        <Row label="Emergency contacts">
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span>
                  {c.name} ({c.relation})
                </span>
                <a href={`tel:${c.phone!.replace(/\s/g, "")}`} className="btn-primary btn-md">
                  <Phone className="h-4 w-4" aria-hidden /> {c.phone}
                </a>
              </li>
            ))}
          </ul>
        </Row>
      </article>
    </>
  );
}
