import { CalendarPlus, MapPin } from "lucide-react";
import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { formatDateTime } from "@/lib/time";
import { googleCalendarLink, googleMapsLink } from "@/lib/reminders";
import { addQuestion, toggleCarry } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";
import { Avatar } from "@/components/ui";

export default async function DoctorPage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const upcoming = data.appointments.filter((a) => new Date(a.at) > new Date());
  const next = upcoming[0];
  if (!next)
    return (
      <div className="space-y-4">
        <h1 className="text-elder-display">Doctor visits</h1>
        <p className="text-elder-body text-muted">No visits booked. Your family can add one.</p>
      </div>
    );
  const escort = data.members.find((m) => m.id === next.escortMemberId);

  return (
    <div className="space-y-6">
      <h1 className="text-elder-display">Next doctor visit</h1>
      <section className="card space-y-3 p-5">
        <p className="text-elder-title">{formatDateTime(next.at)}</p>
        <p className="text-elder-body">
          <strong>{next.doctor}</strong>
          {next.specialty ? `, ${next.specialty}` : ""}
        </p>
        <p className="text-elder-body text-muted">
          {next.clinic}, {next.address}
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <a
            href={googleMapsLink(`${next.clinic}, ${next.address}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline btn-elder"
          >
            <MapPin className="h-6 w-6" aria-hidden /> Map
          </a>
          <a
            href={googleCalendarLink(next.doctor, next.clinic, next.address, next.at)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline btn-elder"
          >
            <CalendarPlus className="h-6 w-6" aria-hidden /> Calendar
          </a>
        </div>
      </section>
      <section className="card flex items-center gap-4 p-5">
        {escort ? (
          <>
            <Avatar name={escort.name} />
            <p className="text-elder-body">
              <strong>{escort.name.split(" ")[0]}</strong> is taking you
            </p>
          </>
        ) : (
          <p className="text-elder-body text-muted">Nobody has said they will go with you yet.</p>
        )}
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-elder-title">Carry with you</h2>
        <ul className="space-y-2">
          {next.carry.map((c, i) => (
            <li key={c.label}>
              <form action={toggleCarry}>
                <input type="hidden" name="id" value={next.id} />
                <input type="hidden" name="index" value={i} />
                <button
                  className="flex min-h-elder w-full items-center gap-4 rounded-xl px-2 text-left text-elder-body"
                  aria-pressed={c.done}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-md border-2 ${c.done ? "border-taken bg-taken text-white" : "border-outline"}`}
                    aria-hidden
                  >
                    {c.done ? "✓" : ""}
                  </span>
                  <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="text-elder-title">Questions to ask</h2>
        <ul className="space-y-2">
          {next.questions.map((q, i) => (
            <li key={i} className="rounded-xl bg-surface-low p-3 text-elder-body">
              {q.text} <span className="block text-base text-muted">From {q.by.split(" ")[0]}</span>
            </li>
          ))}
        </ul>
        <form action={addQuestion} className="space-y-2">
          <input type="hidden" name="id" value={next.id} />
          <label className="block">
            <span className="text-elder-body font-semibold">Add my own question</span>
            <input name="text" required minLength={3} className="field mt-2 text-elder-body" />
          </label>
          <SubmitButton className="btn-primary btn-elder">Add question</SubmitButton>
        </form>
      </section>
    </div>
  );
}
