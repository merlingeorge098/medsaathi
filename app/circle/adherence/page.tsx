import clsx from "clsx";
import { requireSession } from "@/lib/session";
import { elderName, loadCareData } from "@/lib/care";
import { buildAdherence, REASON_LABEL, type CellStatus } from "@/lib/adherence";
import { formatDate, localNow } from "@/lib/time";
import { DoctorSummary } from "@/components/forms";
import { PageHeader, SectionTitle } from "@/components/ui";

const CELL: Record<CellStatus, { cls: string; label: string; mark: string }> = {
  taken: { cls: "bg-taken text-white", label: "Taken on time", mark: "✓" },
  late: { cls: "bg-due-soft text-due border border-due/40", label: "Taken late", mark: "L" },
  missed: { cls: "bg-missed text-white", label: "Missed", mark: "!" },
  none: { cls: "bg-surface-high", label: "No dose", mark: "" },
};
const SLOTS = ["Morning", "Afternoon", "Evening", "Night"] as const;

export default async function AdherencePage() {
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const report = buildAdherence(data.medications, data.doseLogs, localNow().date, 30, new Date());
  const slots = SLOTS.filter((s) => report.days.some((d) => d.slots[s] !== "none"));

  return (
    <>
      <PageHeader
        eyebrow="Adherence"
        title="Last 30 days"
        subtitle={`${report.onTimePct}% on time: ${report.onTime} on time, ${report.late} late, ${report.missed} missed out of ${report.total}.`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="heat" className="card overflow-x-auto p-5">
          <SectionTitle>
            <span id="heat">Dose calendar</span>
          </SectionTitle>
          <table className="border-separate border-spacing-1 text-sm">
            <caption className="sr-only">Daily dose outcomes for {elderName(data.profile)} by time of day</caption>
            <thead>
              <tr>
                <th scope="col" className="sr-only">
                  Time of day
                </th>
                {report.days.map((d) => (
                  <th key={d.date} scope="col" className="w-7 font-normal text-muted">
                    {Number(d.date.slice(8))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s}>
                  <th scope="row" className="pr-2 text-left font-semibold">
                    {s}
                  </th>
                  {report.days.map((d) => {
                    const c = CELL[d.slots[s]];
                    return (
                      <td
                        key={d.date}
                        title={`${formatDate(d.date, { day: "numeric", month: "short" })}: ${c.label}`}
                        className={clsx("h-7 w-7 rounded text-center text-xs font-bold", c.cls)}
                      >
                        <span className="sr-only">
                          {formatDate(d.date, { day: "numeric", month: "short" })} {s}:{" "}
                        </span>
                        {c.mark}
                        <span className="sr-only">{c.label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-4 flex flex-wrap gap-4 text-sm">
            {(["taken", "late", "missed"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span
                  className={clsx("flex h-5 w-5 items-center justify-center rounded text-xs font-bold", CELL[k].cls)}
                  aria-hidden
                >
                  {CELL[k].mark}
                </span>
                {CELL[k].label}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="patterns" className="card p-5">
          <SectionTitle>
            <span id="patterns">Patterns we noticed</span>
          </SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-base">
            {report.patterns.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      </div>
      <section aria-labelledby="per-med" className="card mt-6 overflow-x-auto p-5">
        <SectionTitle>
          <span id="per-med">By medicine</span>
        </SectionTitle>
        <table className="w-full text-left text-base">
          <thead className="text-sm text-muted">
            <tr>
              <th className="py-2">Medicine</th>
              <th>On time</th>
              <th>Late</th>
              <th>Missed</th>
              <th>Main skip reason</th>
            </tr>
          </thead>
          <tbody>
            {report.perMedication.map((m) => (
              <tr key={m.medication.id} className="border-t border-line/60">
                <td className="py-3 font-semibold">
                  {m.medication.name} {m.medication.strength}
                </td>
                <td>{m.total ? Math.round((m.onTime / m.total) * 100) : 100}%</td>
                <td>{m.late}</td>
                <td>{m.missed}</td>
                <td>{m.topReason ? REASON_LABEL[m.topReason] : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="mt-6">
        <DoctorSummary />
      </div>
    </>
  );
}
