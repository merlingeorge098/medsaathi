import Link from "next/link";
import { AlertTriangle, CalendarDays, MessageCircle, Phone, Pill, ShoppingCart } from "lucide-react";
import { dailyUpdateText, whatsappLink } from "@/lib/share";
import { appUrl } from "@/lib/email";
import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { buildToday } from "@/lib/today";
import { buildAdherence, REASON_LABEL } from "@/lib/adherence";
import { can } from "@/lib/permissions";
import { daysOfStockLeft } from "@/lib/prescription";
import { formatDate, formatDateTime, formatTime, localNow, relativeTime } from "@/lib/time";
import { markDose } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";
import { Avatar, Notice, PageHeader, PillArt, SectionTitle, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const MOOD = { good: "Good", okay: "Okay", unwell: "Not well" } as const;

export default async function CircleToday({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const now = new Date();
  const name = elderName(data.profile);
  const today = buildToday(data.medications, data.doseLogs, data.profile.escalation, now);
  const week = buildAdherence(data.medications, data.doseLogs, localNow(now).date, 7, now);
  const next = data.appointments.find((a) => new Date(a.at) > now);
  const low = data.medications
    .map((m) => ({ m, days: daysOfStockLeft(m.stock, m.times, m.dosePerTime) }))
    .filter((x) => x.days <= data.profile.escalation.refillWarnDays)
    .sort((a, b) => a.days - b.days);
  const missed = today.doses.filter((d) => d.status === "missed" || d.status === "skipped");
  const pending = data.changeRequests.filter((c) => c.status === "pending");
  const checkIn = data.checkIns[0];
  const canLog = can(session.role, "logDose");
  const tel = data.profile.phone ? `tel:${data.profile.phone.replace(/\s/g, "")}` : undefined;

  return (
    <>
      <PageHeader
        eyebrow={`Care circle, ${formatDate(today.date)}`}
        title={`${name}'s day`}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappLink(dailyUpdateText(name, formatDate(today.date), today.doses, appUrl()))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-md bg-[#1f8f4e] text-white hover:bg-[#187540]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> Send today&apos;s update on WhatsApp
            </a>
            {tel ? (
              <a href={tel} className="btn-outline btn-md">
                <Phone className="h-4 w-4" aria-hidden /> Call {name}
              </a>
            ) : null}
          </div>
        }
      />
      {params.welcome ? (
        <div className="mb-6">
          <Notice tone="success">
            Care circle created. Share the Care Code {data.profile.careCode} with family, then add medicines.
          </Notice>
        </div>
      ) : null}

      <section aria-label="Summary" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="eyebrow text-muted">Today&apos;s doses</p>
          <p className="mt-2 text-4xl font-bold">
            {today.taken} <span className="text-xl font-normal text-muted">of {today.doses.length} taken</span>
          </p>
          <div
            className="mt-3 h-2 rounded-full bg-surface-high"
            role="progressbar"
            aria-valuenow={today.taken}
            aria-valuemin={0}
            aria-valuemax={today.doses.length}
            aria-label="Doses taken today"
          >
            <div
              className="h-2 rounded-full bg-primary-soft"
              style={{ width: `${today.doses.length ? (today.taken / today.doses.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <Link href="/circle/adherence" className="card p-5 hover:border-primary-soft">
          <p className="eyebrow text-muted">Last 7 days</p>
          <p className="mt-2 text-4xl font-bold">
            {week.onTimePct}% <span className="text-xl font-normal text-muted">on time</span>
          </p>
          <p className="mt-2 text-base text-muted">
            {week.missed} missed, {week.late} late
          </p>
        </Link>
        <Link href="/circle/appointments" className="card p-5 hover:border-primary-soft">
          <p className="eyebrow text-muted">Next visit</p>
          {next ? (
            <>
              <p className="mt-2 text-lg font-bold">{formatDateTime(next.at)}</p>
              <p className="text-base text-muted">{next.doctor}</p>
            </>
          ) : (
            <p className="mt-2 text-base text-muted">None booked</p>
          )}
        </Link>
        <Link
          href="/circle/medicines"
          className={`card p-5 hover:border-primary-soft ${low.length ? "border-clay-strong/50 bg-clay-soft/40" : ""}`}
        >
          <p className="eyebrow">{low.length ? "Refill soon" : "Stock"}</p>
          {low[0] ? (
            <>
              <p className="mt-2 text-lg font-bold">
                {low[0].m.name} {low[0].m.strength}
              </p>
              <p className="text-base text-clay">
                {low[0].days} day{low[0].days === 1 ? "" : "s"} left
              </p>
            </>
          ) : (
            <p className="mt-2 text-base text-muted">All medicines have enough stock</p>
          )}
        </Link>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="timeline" className="card p-5 md:p-6">
          <SectionTitle>
            <span id="timeline">Today&apos;s timeline</span>
          </SectionTitle>
          {today.doses.length === 0 ? (
            <p className="text-base text-muted">
              No medicines yet.{" "}
              <Link href="/circle/medicines/new" className="font-semibold text-primary underline">
                Add the first one
              </Link>
              .
            </p>
          ) : (
            <ol className="space-y-3">
              {today.doses.map((d) => (
                <li
                  key={d.id}
                  className={`flex flex-wrap items-center gap-4 rounded-card border p-4 ${d.status === "missed" || d.status === "skipped" ? "border-missed/30 bg-missed-soft/50" : "border-line/60 bg-surface-low"}`}
                >
                  <p className="w-20 text-lg font-bold">{formatTime(d.time)}</p>
                  <PillArt shape={d.medication.shape} color={d.medication.color} size={48} />
                  <div className="min-w-40 flex-1">
                    <p className="text-lg font-bold">
                      {d.medication.name} {d.medication.strength}
                    </p>
                    <p className="text-sm text-muted">
                      {d.log?.status === "taken" && d.log.actedAt
                        ? `Taken at ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(new Date(d.log.actedAt))}${d.log.actedBy && d.log.actedBy !== data.members.find((m) => m.role === "owner")?.id ? ` by ${data.members.find((m) => m.id === d.log?.actedBy)?.name.split(" ")[0] ?? "family"}` : ""}`
                        : d.log?.reason
                          ? `Reason: ${REASON_LABEL[d.log.reason]}`
                          : (d.medication.purpose ?? "")}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  {canLog && d.status !== "taken" && d.status !== "upcoming" ? (
                    <form action={markDose}>
                      <input type="hidden" name="medicationId" value={d.medication.id} />
                      <input type="hidden" name="date" value={d.date} />
                      <input type="hidden" name="time" value={d.time} />
                      <input type="hidden" name="action" value="taken" />
                      <SubmitButton
                        className="btn-outline px-4 py-2 text-sm"
                        ariaLabel={`Mark ${d.medication.name} as taken for ${name}`}
                      >
                        Mark taken
                      </SubmitButton>
                    </form>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="attention" className="card space-y-4 p-5">
            <SectionTitle>
              <span id="attention">Needs attention</span>
            </SectionTitle>
            {missed.length + pending.length + low.length === 0 ? (
              <p className="text-base text-muted">All good right now.</p>
            ) : null}
            {missed.map((d) => (
              <div key={d.id} className="rounded-xl border-l-4 border-missed bg-missed-soft/60 p-4">
                <p className="flex items-center gap-2 font-bold text-missed">
                  <AlertTriangle className="h-5 w-5" aria-hidden /> {d.status === "skipped" ? "Skipped" : "Missed"}:{" "}
                  {d.medication.name} ({formatTime(d.time)})
                </p>
                <p className="mt-1 text-base">
                  {d.log?.reason ? `${name} said: ${REASON_LABEL[d.log.reason]}.` : "Not marked as taken yet."}
                </p>
                {tel ? (
                  <a href={tel} className="btn-outline btn-md mt-3">
                    <Phone className="h-4 w-4" aria-hidden /> Call {name}
                  </a>
                ) : null}
              </div>
            ))}
            {pending.map((c) => (
              <div key={c.id} className="rounded-xl bg-clay-soft/60 p-4">
                <p className="font-bold text-clay">Waiting for {name}&apos;s approval</p>
                <p className="mt-1 text-base">
                  {c.requestedByName.split(" ")[0]} asked to{" "}
                  {c.kind === "add_medication"
                    ? `add ${c.after?.name}`
                    : c.kind === "remove_medication"
                      ? `stop ${c.before?.name}`
                      : `change ${data.medications.find((m) => m.id === c.medicationId)?.name ?? "a medicine"}`}
                  . {relativeTime(c.createdAt)}.
                </p>
              </div>
            ))}
            {low.map(({ m, days }) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl bg-surface-low p-4">
                <ShoppingCart className="h-5 w-5 text-clay" aria-hidden />
                <p className="flex-1 text-base">
                  <strong>{m.name}</strong>: {m.stock} tablets, {days} day{days === 1 ? "" : "s"} left
                </p>
              </div>
            ))}
          </section>

          <section aria-labelledby="checkin" className="card p-5">
            <SectionTitle>
              <span id="checkin">Latest check-in</span>
            </SectionTitle>
            {checkIn ? (
              <div>
                <p className="text-lg font-bold">
                  Feeling: {MOOD[checkIn.mood]}{" "}
                  <span className="text-sm font-normal text-muted">{relativeTime(checkIn.at)}</span>
                </p>
                {checkIn.note ? (
                  <p className="mt-2 rounded-xl bg-surface-low p-3 text-base italic">&ldquo;{checkIn.note}&rdquo;</p>
                ) : null}
              </div>
            ) : (
              <p className="text-base text-muted">{name} hasn&apos;t checked in yet.</p>
            )}
          </section>

          <section aria-labelledby="recent" className="card p-5">
            <SectionTitle
              action={
                <Link href="/circle/activity" className="text-sm font-semibold text-primary underline">
                  See all
                </Link>
              }
            >
              <span id="recent">Recent activity</span>
            </SectionTitle>
            <ul className="space-y-3">
              {data.activity.slice(0, 4).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <Avatar name={a.actor} size="sm" tone={a.actor === data.profile.name ? "teal" : "clay"} />
                  <p className="text-base">
                    {a.text} <span className="block text-sm text-muted">{relativeTime(a.at)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex flex-wrap gap-3">
            {can(session.role, "proposeMedication") ? (
              <Link href="/circle/medicines/new" className="btn-primary btn-md">
                <Pill className="h-4 w-4" aria-hidden /> Add medicine
              </Link>
            ) : null}
            {can(session.role, "manageAppointments") ? (
              <Link href="/circle/appointments" className="btn-outline btn-md">
                <CalendarDays className="h-4 w-4" aria-hidden /> Add visit
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
