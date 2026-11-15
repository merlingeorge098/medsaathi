import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, HeartHandshake, KeyRound, ShieldCheck, User, Users } from "lucide-react";
import { demoLogin } from "./actions/auth";
import { getSession } from "@/lib/session";
import { SubmitButton } from "@/components/client";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "owner" ? "/elder" : "/circle");

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8 md:py-14">
      <p className="text-lg font-bold text-primary">MedSaathi</p>

      <section className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">Dawa time pe, parivaar saath mein.</h1>
          <p className="mt-4 text-elder-body text-muted">
            Medicines, doctor visits and reminders for elderly parents, shared with the whole family. The family helps. The elder decides.
          </p>

          <div className="card mt-8 space-y-4 bg-surface-low p-5">
            <p className="eyebrow">Try it with a real-looking family</p>
            <p className="text-base text-muted">Shantaram Joshi (Baba), 76, with his son Rahul, daughter-in-law Priya and nurse Sunita. 30 days of history already in.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <form action={demoLogin}>
                <input type="hidden" name="as" value="elder" />
                <SubmitButton className="btn-primary btn-elder" pendingText="Opening...">See Baba&apos;s view</SubmitButton>
              </form>
              <form action={demoLogin}>
                <input type="hidden" name="as" value="family" />
                <SubmitButton className="btn-outline btn-elder" pendingText="Opening...">See Rahul&apos;s view</SubmitButton>
              </form>
            </div>
            <p className="text-sm text-outline">Or log in with Care Code 482915: Baba&apos;s PIN is 1234. Family: rahul.demo@medsaathi.app, passcode 2468.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Who is this for?</h2>
          <Link href="/start?for=self" className="card flex items-center gap-4 p-5 transition-colors hover:border-primary-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary"><User className="h-7 w-7" aria-hidden /></span>
            <span>
              <span className="block text-xl font-bold">For me</span>
              <span className="text-base text-muted">I want to manage my own medicines</span>
            </span>
          </Link>
          <Link href="/start?for=other" className="card flex items-center gap-4 p-5 transition-colors hover:border-primary-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-soft text-clay"><Users className="h-7 w-7" aria-hidden /></span>
            <span>
              <span className="block text-xl font-bold">For someone I care for</span>
              <span className="text-base text-muted">I&apos;m a family member or caretaker</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/join" className="btn-outline btn-md"><KeyRound className="h-4 w-4" aria-hidden /> I have a Care Code</Link>
            <Link href="/login" className="btn-ghost btn-md">Log in</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="why" className="mt-16">
        <h2 id="why" className="sr-only">Why MedSaathi</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "The elder stays in charge", text: "When family changes a medicine, the elder sees it and says yes or no. Nothing changes behind their back." },
            { icon: BellRing, title: "Reminders that escalate", text: "A nudge at dose time, an email to the main caretaker after 30 minutes, the whole family after an hour." },
            { icon: HeartHandshake, title: "Missed is information", text: "When a dose is skipped we ask why, so the family and doctor see patterns instead of guilt." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="card p-5">
              <Icon className="h-7 w-7 text-primary-soft" aria-hidden />
              <p className="mt-3 text-lg font-bold">{title}</p>
              <p className="mt-1 text-base text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
