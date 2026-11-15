import Link from "next/link";
import clsx from "clsx";
import { requireSession } from "@/lib/session";
import { loadCareData } from "@/lib/care";
import { formatDate, localNow, relativeTime } from "@/lib/time";
import { Avatar, PageHeader } from "@/components/ui";
import type { Activity } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "medicine", label: "Medicines" },
  { key: "dose", label: "Doses" },
  { key: "appointment", label: "Appointments" },
  { key: "member", label: "Members" },
  { key: "checkin", label: "Check-ins" },
] as const;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "all" } = await searchParams;
  const session = await requireSession();
  const data = await loadCareData(session.profileId);
  const items = data.activity.filter((a) => type === "all" || a.kind === type).slice(0, 100);
  const groups = new Map<string, Activity[]>();
  for (const a of items) {
    const day = localNow(new Date(a.at)).date;
    groups.set(day, [...(groups.get(day) ?? []), a]);
  }

  return (
    <>
      <PageHeader eyebrow="Activity" title="Everything that changed" subtitle="Every change shows who made it. Nothing happens behind anyone's back." />
      <nav aria-label="Filter activity" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/circle/activity" : `/circle/activity?type=${f.key}`} aria-current={type === f.key ? "page" : undefined} className={clsx("rounded-full border px-4 py-2 text-base", type === f.key ? "border-primary-soft bg-primary-soft text-white" : "border-line bg-card")}>
            {f.label}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? <p className="text-base text-muted">Nothing here yet.</p> : null}
      {[...groups.entries()].map(([day, list]) => (
        <section key={day} className="mb-6">
          <h2 className="mb-3 text-lg font-bold">{formatDate(day)}</h2>
          <ul className="card divide-y divide-line/60">
            {list.map((a) => (
              <li key={a.id} className="flex gap-3 p-4">
                <Avatar name={a.actor} size="sm" tone={a.actor === data.profile.name ? "teal" : "clay"} />
                <p className="text-base">{a.text}<span className="block text-sm text-muted">{relativeTime(a.at)}</span></p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
