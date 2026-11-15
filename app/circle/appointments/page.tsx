import { CalendarPlus, MapPin } from "lucide-react";
import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/time";
import { googleCalendarLink, googleMapsLink } from "@/lib/reminders";
import { addQuestion, claimEscort, toggleCarry } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";
import { AppointmentForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";

export default async function AppointmentsPage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const name = elderName(data.profile);
  const upcoming = data.appointments.filter((a) => new Date(a.at) > new Date());
  const editable = can(session.role, "manageAppointments");

  return (
    <>
      <PageHeader eyebrow="Appointments" title="Doctor visits" subtitle={`Reminders go to ${name}, the person going along and the primary caretaker.`} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <ul className="space-y-4">
          {upcoming.length === 0 ? <li className="text-base text-muted">No upcoming visits.</li> : null}
          {upcoming.map((a) => {
            const escort = data.members.find((m) => m.id === a.escortMemberId);
            const mine = a.escortMemberId === session.memberId;
            return (
              <li key={a.id} className="card space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold">{formatDateTime(a.at)}</p>
                    <p className="text-base">{a.doctor}{a.specialty ? `, ${a.specialty}` : ""}</p>
                    <p className="text-base text-muted">{a.clinic}{a.address ? `, ${a.address}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={googleCalendarLink(a.doctor, a.clinic, a.address, a.at)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-sm"><CalendarPlus className="h-4 w-4" aria-hidden /> Google Calendar</a>
                    <a href={googleMapsLink(`${a.clinic}, ${a.address}`)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-sm"><MapPin className="h-4 w-4" aria-hidden /> Maps</a>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-low p-3">
                  <p className="flex-1 text-base">{escort ? <><strong>{escort.name}</strong> is taking {name}</> : `Nobody is going with ${name} yet`}</p>
                  {editable && (!escort || mine) ? (
                    <form action={claimEscort}><input type="hidden" name="id" value={a.id} /><SubmitButton className={mine ? "btn-ghost btn-md" : "btn-primary btn-md"}>{mine ? "I can't go" : "I'll take them"}</SubmitButton></form>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 font-bold">Carry</p>
                    <ul className="space-y-1">
                      {a.carry.map((c, i) => (
                        <li key={c.label}>
                          <form action={toggleCarry}>
                            <input type="hidden" name="id" value={a.id} /><input type="hidden" name="index" value={i} />
                            <button disabled={!editable} aria-pressed={c.done} className="flex items-center gap-2 text-base">
                              <span className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs ${c.done ? "border-taken bg-taken text-white" : "border-outline"}`} aria-hidden>{c.done ? "✓" : ""}</span>
                              <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 font-bold">Questions for the doctor</p>
                    <ul className="mb-2 space-y-1 text-base">{a.questions.map((q, i) => <li key={i}>{q.text} <span className="text-sm text-muted">({q.by.split(" ")[0]})</span></li>)}</ul>
                    {editable ? (
                      <form action={addQuestion} className="flex gap-2">
                        <input type="hidden" name="id" value={a.id} />
                        <label className="flex-1"><span className="sr-only">New question</span><input name="text" required minLength={3} className="field py-2" placeholder="Add a question" /></label>
                        <SubmitButton className="btn-outline btn-md">Add</SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {editable ? <AppointmentForm /> : null}
      </div>
    </>
  );
}
