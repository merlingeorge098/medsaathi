import Link from "next/link";
import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { formatDateTime, formatTime } from "@/lib/time";
import { ROLE_DESCRIPTION } from "@/lib/permissions";
import { decideChange, decideMember } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";
import { Avatar } from "@/components/ui";
import type { Medication } from "@/lib/types";

const fmtTimes = (t?: string[]) => (t ?? []).map(formatTime).join(", ");

function Side({ title, med }: { title: string; med?: Partial<Medication> }) {
  return (
    <div className="flex-1 rounded-xl bg-surface-low p-4">
      <p className="eyebrow">{title}</p>
      {med ? (
        <>
          <p className="mt-1 text-elder-body font-bold">{med.name ?? ""} {med.strength ?? ""}</p>
          <p className="text-elder-body">{fmtTimes(med.times) || "Stopped"}</p>
        </>
      ) : (
        <p className="mt-1 text-elder-body text-muted">Not taking it</p>
      )}
    </div>
  );
}

export default async function ApprovalsPage() {
  const session = await requireSession("approveChanges");
  const data = await loadCareData(session.profileId);
  const changes = data.changeRequests.filter((c) => c.status === "pending");
  const people = data.members.filter((m) => m.status === "pending");
  const medName = (id?: string) => data.medications.find((m) => m.id === id);

  return (
    <div className="space-y-8">
      <h1 className="text-elder-display">Waiting for you</h1>
      {changes.length + people.length === 0 ? <p className="text-elder-body text-muted">Nothing to decide right now.</p> : null}

      {changes.map((c) => {
        const current = medName(c.medicationId);
        const before = c.kind === "add_medication" ? undefined : { ...current, ...c.before };
        const after = c.kind === "remove_medication" ? undefined : { ...current, ...c.after };
        return (
          <section key={c.id} className="card space-y-5 p-5" aria-label={`Change from ${c.requestedByName}`}>
            <h2 className="text-elder-title">
              {c.requestedByName.split(" ")[0]} wants to {c.kind === "add_medication" ? "add a medicine" : c.kind === "remove_medication" ? "stop a medicine" : "change something"}
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Side title="Before" med={before} />
              <Side title="After" med={after} />
            </div>
            {c.note ? <blockquote className="border-l-4 border-clay-strong pl-4 text-elder-body italic">&ldquo;{c.note}&rdquo;</blockquote> : null}
            <form action={decideChange} className="space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <SubmitButton name="decision" value="approved" className="btn-primary btn-elder">Yes, okay</SubmitButton>
              <SubmitButton name="decision" value="declined" className="btn-outline btn-elder">No, keep it</SubmitButton>
              <SubmitButton name="decision" value="later" className="btn-ghost btn-elder">Ask me later</SubmitButton>
            </form>
            <p className="text-base text-muted">Asked by {c.requestedByName}, {formatDateTime(c.createdAt)}</p>
          </section>
        );
      })}

      {people.map((m) => (
        <section key={m.id} className="card space-y-5 p-5" aria-label={`Join request from ${m.name}`}>
          <div className="flex items-center gap-4">
            <Avatar name={m.name} size="lg" tone="clay" />
            <div>
              <h2 className="text-elder-title">{m.name} wants to join your care circle</h2>
              <p className="text-elder-body text-muted">{m.relation}</p>
            </div>
          </div>
          <form action={decideMember} className="space-y-4">
            <input type="hidden" name="id" value={m.id} />
            <fieldset className="space-y-3">
              <legend className="mb-2 text-elder-body font-bold">What can {m.name.split(" ")[0]} do?</legend>
              {(Object.keys(ROLE_DESCRIPTION) as (keyof typeof ROLE_DESCRIPTION)[]).map((role, i) => (
                <label key={role} className="flex min-h-elder cursor-pointer items-center gap-4 rounded-xl border-2 border-line px-4 has-[:checked]:border-primary-soft has-[:checked]:bg-surface-low">
                  <input type="radio" name="role" value={role} defaultChecked={i === 0} className="h-6 w-6 accent-[#1e6b62]" />
                  <span className="text-elder-body">{ROLE_DESCRIPTION[role]}</span>
                </label>
              ))}
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <SubmitButton name="decision" value="allow" className="btn-primary btn-elder">Allow</SubmitButton>
              <SubmitButton name="decision" value="deny" className="btn-outline btn-elder">Don&apos;t allow</SubmitButton>
            </div>
          </form>
        </section>
      ))}
      <Link href="/elder" className="btn-ghost btn-elder">Back to today</Link>
    </div>
  );
}
