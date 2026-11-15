import Link from "next/link";
import { AlarmClock, ArrowRight, BellRing, CheckCircle2, GlassWater, Smile } from "lucide-react";
import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { buildToday } from "@/lib/today";
import { formatDate, formatTime, localNow, slotLabel } from "@/lib/time";
import { markDose } from "@/app/actions/care";
import { ReadAloud, SubmitButton } from "@/components/client";
import { doseSpeech, nextDoseSpeech } from "@/lib/voice";
import { Notice, PillArt, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

function greeting(minutes: number) {
  if (minutes < 12 * 60) return "Suprabhat";
  if (minutes < 17 * 60) return "Namaste";
  return "Shubh sandhya";
}

export default async function ElderToday({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const now = new Date();
  const today = buildToday(data.medications, data.doseLogs, data.profile.escalation, now);
  const pendingChanges = data.changeRequests.filter((c) => c.status === "pending");
  const pendingMembers = data.members.filter((m) => m.status === "pending");
  const waiting = pendingChanges.length + pendingMembers.length;
  const checkedInToday = data.checkIns.some((c) => localNow(new Date(c.at)).date === today.date);
  const name = elderName(data.profile);
  const current = today.current;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-elder-display">{greeting(localNow(now).minutes)}, {name} ji</h1>
        <p className="mt-1 text-elder-body text-muted">{formatDate(today.date)}</p>
      </div>

      {params.skipped ? <Notice tone="info">That&apos;s okay. Your family has been told so they can help.</Notice> : null}
      {params.checkedIn ? <Notice tone="success">Thank you. Your family can see how you&apos;re feeling.</Notice> : null}
      {params.welcome ? <Notice tone="success">Your care circle is ready. Share your Care Code from My Family.</Notice> : null}

      {waiting > 0 ? (
        <Link href="/elder/approvals" className="flex items-center gap-4 rounded-card bg-clay-soft p-5 text-clay">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay text-white"><BellRing className="h-6 w-6" aria-hidden /></span>
          <span className="flex-1">
            <span className="block text-elder-body font-bold">
              {pendingChanges[0] ? `${pendingChanges[0].requestedByName.split(" ")[0]} wants to change ${pendingChanges.length === 1 ? "1 thing" : `${pendingChanges.length} things`}` : `${pendingMembers.length} new family request`}
            </span>
            <span className="text-base">You decide. Tap to check.</span>
          </span>
          <ArrowRight className="h-7 w-7" aria-hidden />
        </Link>
      ) : null}

      <section aria-labelledby="now-title" className="card p-5">
        {current ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={current.status} detail={`${formatTime(current.time)}`} />
              <span className="text-base text-muted">{current.medication.food === "any" ? slotLabel(current.time) : `${current.medication.food === "after" ? "After" : "Before"} ${slotLabel(current.time) === "Morning" ? "breakfast" : slotLabel(current.time) === "Night" ? "dinner" : "lunch"}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <PillArt shape={current.medication.shape} color={current.medication.color} size={88} />
              <div>
                {current.medication.purpose ? <p className="text-base font-semibold text-primary">For {current.medication.purpose.toLowerCase()}</p> : null}
                <h2 id="now-title" className="text-elder-title">{current.medication.name} {current.medication.strength}</h2>
                <p className="text-elder-body text-muted">
                  Take {current.medication.dosePerTime} {current.medication.color?.toLowerCase()} {current.medication.shape?.toLowerCase()} tablet{current.medication.dosePerTime > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="flex items-center gap-3 rounded-xl bg-surface-low p-4 text-base">
              <GlassWater className="h-6 w-6 shrink-0 text-primary-soft" aria-hidden /> Have a full glass of water with it.
            </p>
            <ReadAloud
              {...doseSpeech({ elderName: name, medicine: current.medication.name, strength: current.medication.strength, tablets: current.medication.dosePerTime, food: current.medication.food })}
            />
            <div className="space-y-3">
              <form action={markDose}>
                <input type="hidden" name="medicationId" value={current.medication.id} />
                <input type="hidden" name="date" value={current.date} />
                <input type="hidden" name="time" value={current.time} />
                <input type="hidden" name="action" value="taken" />
                <SubmitButton className="btn-primary btn-elder text-2xl" pendingText="Saving...">
                  <CheckCircle2 className="h-7 w-7" aria-hidden /> I took it
                </SubmitButton>
              </form>
              <form action={markDose}>
                <input type="hidden" name="medicationId" value={current.medication.id} />
                <input type="hidden" name="date" value={current.date} />
                <input type="hidden" name="time" value={current.time} />
                <input type="hidden" name="action" value="snooze" />
                <SubmitButton className="btn-outline btn-elder" pendingText="Saving...">
                  <AlarmClock className="h-6 w-6" aria-hidden /> Remind me in 15 min
                </SubmitButton>
              </form>
            </div>
            <Link href={`/elder/skip?med=${current.medication.id}&date=${current.date}&time=${current.time}`} className="block py-2 text-center text-elder-body text-primary-soft underline underline-offset-4">
              I can&apos;t take it now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-taken" aria-hidden />
            <h2 id="now-title" className="text-elder-title">Nothing to take right now</h2>
            <p className="text-elder-body text-muted">
              {today.taken} of {today.doses.length} medicines taken today.
              {today.later[0] ? ` Next: ${today.later[0].medication.name} at ${formatTime(today.later[0].time)}.` : " All done for today."}
            </p>
            <div className="mt-2 w-full">
              <ReadAloud
                {...nextDoseSpeech(
                  name,
                  today.later[0] ? { medicine: today.later[0].medication.name, strength: today.later[0].medication.strength, time: formatTime(today.later[0].time) } : undefined,
                )}
              />
            </div>
          </div>
        )}
      </section>

      {!checkedInToday ? (
        <Link href="/elder/checkin" className="card flex items-center gap-4 p-5">
          <Smile className="h-10 w-10 text-primary-soft" aria-hidden />
          <span className="flex-1 text-elder-body font-semibold">How are you feeling today?</span>
          <ArrowRight className="h-6 w-6 text-primary-soft" aria-hidden />
        </Link>
      ) : null}

      <section aria-labelledby="later-title">
        <h2 id="later-title" className="mb-3 text-elder-title">Later today</h2>
        {today.later.length === 0 ? (
          <p className="text-elder-body text-muted">Nothing else today.</p>
        ) : (
          <ul className="space-y-3">
            {today.later.map((d) => (
              <li key={d.id} className="card flex items-center gap-4 p-4">
                <PillArt shape={d.medication.shape} color={d.medication.color} size={56} />
                <div className="flex-1">
                  <p className="text-elder-body font-bold">{formatTime(d.time)}</p>
                  <p className="text-elder-body">{d.medication.name} {d.medication.strength}</p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="done-title">
        <h2 id="done-title" className="mb-3 text-elder-title">Done today</h2>
        <ul className="space-y-2">
          {today.doses.filter((d) => d.status === "taken" || d.status === "skipped").map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-xl bg-surface-low px-4 py-3 text-elder-body">
              <span>{d.medication.name} <span className="text-muted">{formatTime(d.time)}</span></span>
              <StatusBadge status={d.status} />
            </li>
          ))}
          {today.doses.every((d) => d.status !== "taken" && d.status !== "skipped") ? <li className="text-elder-body text-muted">Nothing yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
