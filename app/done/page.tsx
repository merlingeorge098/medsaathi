import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const COPY = {
  taken: {
    icon: CheckCircle2,
    title: "Marked as taken",
    text: "Thank you. The family dashboard is updated and no more reminders will go out for this dose.",
    tone: "text-taken",
  },
  snoozed: {
    icon: Clock,
    title: "Snoozed for 15 minutes",
    text: "We'll remind again in 15 minutes.",
    tone: "text-due",
  },
  expired: {
    icon: XCircle,
    title: "This link has expired",
    text: "Email links work for 12 hours. Please open MedSaathi to update the dose.",
    tone: "text-missed",
  },
} as const;

export default async function DonePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status as keyof typeof COPY;
  const c = COPY[status] ?? COPY.expired;
  const Icon = c.icon;
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
    >
      <Icon className={`h-20 w-20 ${c.tone}`} aria-hidden />
      <h1 className="text-elder-display">{c.title}</h1>
      <p className="text-elder-body text-muted">{c.text}</p>
      <Link href="/login" className="btn-outline btn-md mt-4">
        Open MedSaathi
      </Link>
    </main>
  );
}
