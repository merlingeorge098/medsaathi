import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { ROLE_LABEL } from "@/lib/permissions";
import { relativeTime } from "@/lib/time";
import { toggleAlerts } from "@/app/actions/care";
import { CopyButton, SubmitButton } from "@/components/client";
import { Avatar, Notice, PageHeader } from "@/components/ui";

export default async function MembersPage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const name = elderName(data.profile);
  const share = `Join ${name}'s care circle on MedSaathi. Care Code: ${data.profile.careCode}`;

  return (
    <>
      <PageHeader
        eyebrow="Care circle"
        title="Who's helping"
        subtitle={`Only ${name} can approve new people and change what they can do.`}
      />
      <section className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="eyebrow text-muted">Care Code</p>
          <p className="font-mono text-4xl font-bold tracking-[0.3em] text-primary">{data.profile.careCode}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CopyButton text={data.profile.careCode} />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(share)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-md"
          >
            Share on WhatsApp
          </a>
        </div>
      </section>
      <ul className="card divide-y divide-line/60">
        {data.members.map((m) => {
          const canToggle =
            m.role !== "owner" && m.status === "active" && (m.id === session.memberId || session.role === "primary");
          return (
            <li
              key={m.id}
              className={`flex flex-wrap items-center gap-4 p-4 ${m.status === "pending" ? "bg-clay-soft/40" : ""}`}
            >
              <Avatar name={m.name} tone={m.role === "owner" ? "teal" : "clay"} />
              <div className="min-w-48 flex-1">
                <p className="text-lg font-bold">
                  {m.name}
                  {m.id === session.memberId ? " (you)" : ""}
                </p>
                <p className="text-base text-muted">
                  {m.relation}
                  {m.lastActiveAt ? `, active ${relativeTime(m.lastActiveAt)}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-surface-high px-3 py-1 text-sm font-semibold">
                {m.status === "pending"
                  ? `Waiting for ${name}`
                  : m.status === "declined"
                    ? "Not approved"
                    : ROLE_LABEL[m.role]}
              </span>
              {canToggle ? (
                <form action={toggleAlerts}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton
                    className={m.alerts ? "btn-primary px-4 py-2 text-sm" : "btn-outline px-4 py-2 text-sm"}
                    ariaLabel={`Alerts for ${m.name}: ${m.alerts ? "on" : "off"}. Toggle`}
                  >
                    Alerts {m.alerts ? "on" : "off"}
                  </SubmitButton>
                </form>
              ) : m.role !== "owner" && m.status === "active" ? (
                <span className="text-sm text-muted">Alerts {m.alerts ? "on" : "off"}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-6">
        <Notice>
          New people join with the Care Code. {name} sees their request and picks what they can do: view only, suggest
          changes, or be the main caretaker.
        </Notice>
      </div>
    </>
  );
}
