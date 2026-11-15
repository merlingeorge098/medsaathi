import { Phone } from "lucide-react";
import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { ROLE_LABEL } from "@/lib/permissions";
import { CopyButton, HoldForHelp } from "@/components/client";
import { Avatar } from "@/components/ui";

export default async function FamilyPage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const family = data.members.filter((m) => m.status === "active" && m.role !== "owner");
  const primary = family.find((m) => m.role === "primary") ?? family[0];

  return (
    <div className="space-y-6">
      <h1 className="text-elder-display">My family</h1>
      <HoldForHelp primaryName={primary?.name.split(" ")[0] ?? "family"} primaryPhone={primary?.phone} />
      <ul className="space-y-3">
        {family.map((m) => (
          <li key={m.id} className="card flex items-center gap-4 p-4">
            <Avatar name={m.name} />
            <div className="flex-1">
              <p className="text-elder-body font-bold">{m.name}</p>
              <p className="text-base text-muted">
                {m.relation}, {ROLE_LABEL[m.role]}
              </p>
            </div>
            {m.phone ? (
              <a
                href={`tel:${m.phone.replace(/\s/g, "")}`}
                className="btn-primary h-14 w-14 rounded-full"
                aria-label={`Call ${m.name}`}
              >
                <Phone className="h-6 w-6" aria-hidden />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <section className="card space-y-3 p-5">
        <h2 className="text-elder-title">Your Care Code</h2>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-primary">{data.profile.careCode}</p>
        <p className="text-elder-body text-muted">Share it with family. You decide what each person can do.</p>
        <CopyButton text={data.profile.careCode} label="Copy code" />
      </section>
    </div>
  );
}
