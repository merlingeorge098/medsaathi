import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { can } from "@/lib/permissions";
import { daysOfStockLeft } from "@/lib/prescription";
import { formatTime } from "@/lib/time";
import { removeMedication } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";
import { Notice, PageHeader, PillArt } from "@/components/ui";

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const name = elderName(data.profile);
  const editable = can(session.role, "proposeMedication");
  const pending = data.changeRequests.filter((c) => c.status === "pending");

  return (
    <>
      <PageHeader eyebrow="Medicines" title={`${name}'s medicines`} subtitle={`Changes you make are sent to ${name} to approve.`} actions={editable ? <Link href="/circle/medicines/new" className="btn-primary btn-md"><Plus className="h-4 w-4" aria-hidden /> Add medicine</Link> : null} />
      {sent ? <div className="mb-6"><Notice tone="success">Sent to {name}. It will apply once they say yes.</Notice></div> : null}
      {pending.length ? <div className="mb-6"><Notice tone="warn">{pending.length} change{pending.length > 1 ? "s" : ""} waiting for {name}&apos;s approval.</Notice></div> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {data.medications.map((m) => {
          const days = daysOfStockLeft(m.stock, m.times, m.dosePerTime);
          const low = days <= data.profile.escalation.refillWarnDays;
          return (
            <li key={m.id} className="card flex flex-col gap-4 p-5">
              <div className="flex items-start gap-4">
                <PillArt shape={m.shape} color={m.color} />
                <div className="flex-1">
                  <p className="text-xl font-bold">{m.name} {m.strength}</p>
                  <p className="text-base text-muted">{m.purpose ?? ""}{m.purpose ? ", " : ""}{m.color?.toLowerCase()} {m.shape?.toLowerCase()}</p>
                </div>
                <span className="rounded-full bg-surface-high px-3 py-1 font-mono text-base font-bold">{m.pattern}</span>
              </div>
              <p className="text-base"><strong>When:</strong> {m.times.map(formatTime).join(", ")} ({m.food === "any" ? "any time" : `${m.food} food`})</p>
              <p className={`text-base ${low ? "font-semibold text-clay" : "text-muted"}`}>{m.stock} tablets left, about {days} day{days === 1 ? "" : "s"}{low ? ". Refill soon." : ""}</p>
              {editable ? (
                <div className="flex gap-3">
                  <Link href={`/circle/medicines/${m.id}`} className="btn-outline btn-md">Edit</Link>
                  <form action={removeMedication}>
                    <input type="hidden" name="id" value={m.id} />
                    <SubmitButton className="btn-ghost btn-md text-missed" ariaLabel={`Ask to stop ${m.name}`}>Ask to stop</SubmitButton>
                  </form>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
