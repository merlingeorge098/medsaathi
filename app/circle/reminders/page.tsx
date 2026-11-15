import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import { relativeTime } from "@/lib/time";
import { EscalationForm, ReminderTools } from "@/components/forms";
import { Notice, PageHeader, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const outbox = (await (await db()).byProfile("outbox", session.profileId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15);

  return (
    <>
      <PageHeader
        eyebrow="Reminders"
        title="When a dose is missed"
        subtitle="Each step only happens if the dose still isn't marked as taken."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <EscalationForm settings={data.profile.escalation} canEdit={can(session.role, "editEscalation")} />
        <div className="space-y-6">
          <ReminderTools />
          <section aria-labelledby="outbox" className="card p-5">
            <SectionTitle>
              <span id="outbox">Recent reminders</span>
            </SectionTitle>
            {!emailConfigured() ? (
              <div className="mb-3">
                <Notice tone="warn">Email sending is switched off, so reminders are saved here instead.</Notice>
              </div>
            ) : null}
            {outbox.length === 0 ? (
              <p className="text-base text-muted">
                No reminders sent yet. They will appear here when a dose is due or missed.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {outbox.map((m) => (
                  <li key={m.id} className="py-3">
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-sm text-muted">
                      To {m.to}, {relativeTime(m.at)}, {m.delivered ? "delivered" : "saved, not emailed"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
