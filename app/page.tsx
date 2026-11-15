import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Check, KeyRound, Mail, MessageCircleHeart, ShieldCheck, Sparkles, User, Users } from "lucide-react";
import { demoLogin } from "./actions/auth";
import { getSession } from "@/lib/session";
import { SubmitButton } from "@/components/client";
import { PillArt } from "@/components/ui";

/** Capsule mark: one half teal (the elder), one half clay (the family). */
function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g transform="rotate(-40 20 20)">
        <rect x="4" y="13" width="32" height="14" rx="7" fill="#1e6b62" />
        <path d="M20 13h9a7 7 0 0 1 0 14h-9z" fill="#c46a3f" />
        <path d="M24 17.5c1.2-1.4 3.4-1 3.6.8.2 1.6-1.9 2.9-3.6 4.2-1.7-1.3-3.8-2.6-3.6-4.2.2-1.8 2.4-2.2 3.6-.8z" fill="#fff" />
      </g>
    </svg>
  );
}

function DemoButtons({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <form action={demoLogin}>
        <input type="hidden" name="as" value="elder" />
        <SubmitButton className="btn-primary btn-elder shadow-lg shadow-primary/20" pendingText="Opening...">
          See Baba&apos;s view <ArrowRight className="h-5 w-5" aria-hidden />
        </SubmitButton>
      </form>
      <form action={demoLogin}>
        <input type="hidden" name="as" value="family" />
        <SubmitButton className={tone === "dark" ? "btn btn-elder border-2 border-white/70 text-white hover:bg-white/10" : "btn-outline btn-elder"} pendingText="Opening...">
          See Rahul&apos;s view
        </SubmitButton>
      </form>
    </div>
  );
}

const LADDER = [
  { time: "1:50 PM", who: "Baba", what: "A gentle heads-up", tone: "bg-primary-tint text-primary" },
  { time: "2:00 PM", who: "Baba", what: "“Time for your medicine” with one-tap buttons", tone: "bg-primary-tint text-primary" },
  { time: "2:30 PM", who: "Rahul", what: "Email: Mark as taken or Snooze, right from the inbox", tone: "bg-due-soft text-due" },
  { time: "3:00 PM", who: "Whole family", what: "Someone calls or drops by", tone: "bg-clay-soft text-clay" },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "owner" ? "/elder" : "/circle");

  return (
    <div className="overflow-x-hidden">
      {/* ------------------------------ Nav ------------------------------ */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <p className="flex items-center gap-2 text-xl font-bold text-primary">
          <Mark /> MedSaathi
        </p>
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          <Link href="/join" className="btn-ghost btn-md hidden sm:inline-flex"><KeyRound className="h-4 w-4" aria-hidden /> I have a Care Code</Link>
          <Link href="/login" className="btn-outline px-5 py-2 text-base">Log in</Link>
        </nav>
      </header>

      <main id="main">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-8 md:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-24 -z-10 h-[34rem] w-[34rem] rounded-full bg-primary-tint/50 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-72 w-72 rounded-full bg-clay-soft/70 blur-3xl" />

          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-clay/20 bg-card/80 px-4 py-1.5 text-sm font-semibold text-clay">
              <span lang="hi">दवा · परिवार</span> <span className="text-line">|</span> Elder-first medicine care
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Dawa time pe,
              <br />
              <span className="italic text-primary-soft">parivaar</span> saath mein.
            </h1>
            <p className="mt-6 max-w-xl text-elder-body text-muted">
              Medicines, doctor visits and reminders for your parents, shared with the whole family.
              <strong className="font-semibold text-ink"> The family helps. The elder decides.</strong>
            </p>

            <div className="mt-8 max-w-xl">
              <DemoButtons />
              <p className="mt-3 text-sm text-outline">
                Opens a demo family with 30 days of history. Or log in with Care Code <span className="font-mono font-bold text-primary">482915</span>, PIN <span className="font-mono font-bold text-primary">1234</span>.
              </p>
            </div>
          </div>

          {/* Phone mock-up of the real Elder Mode screen */}
          <div className="relative mx-auto w-full max-w-[22rem]" aria-label="Preview of Baba's screen" role="img">
            <div className="rotate-[2deg] rounded-[2.75rem] border-[10px] border-ink bg-surface p-5 shadow-2xl shadow-primary/25">
              <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-ink/80" />
              <p className="font-display text-3xl text-ink">Namaste, Baba ji</p>
              <p className="text-sm text-muted">Sunday afternoon</p>
              <div className="mt-5 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-line/60">
                <p className="eyebrow">Time for your medicine</p>
                <div className="mt-3 flex items-center gap-3">
                  <PillArt shape="Round" color="Yellow" size={60} />
                  <div>
                    <p className="text-xl font-bold">Amlodipine 5 mg</p>
                    <p className="text-sm text-muted">1 tablet · after lunch</p>
                  </div>
                </div>
                <div className="mt-5 flex min-h-elder items-center justify-center gap-2 rounded-full bg-primary-soft text-lg font-semibold text-white">
                  <Check className="h-6 w-6" /> I took it
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-semibold text-primary-soft">
                  <div className="rounded-full border-2 border-primary-soft/40 py-2.5 text-center">In 15 min</div>
                  <div className="rounded-full border-2 border-primary-soft/40 py-2.5 text-center">Skip</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-primary-soft">
                <span className="rounded-xl bg-primary-tint/60 py-2">Today</span>
                <span className="py-2">Doctor</span>
                <span className="py-2">My Family</span>
              </div>
            </div>

            <div className="animate-float absolute -left-6 -top-10 hidden w-60 rounded-2xl bg-card p-3 shadow-xl ring-1 ring-line/60 sm:block lg:-left-40">
              <p className="flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-taken-soft text-taken"><Check className="h-4 w-4" /></span> 8:30 dose taken</p>
              <p className="mt-1 text-xs text-muted">Rahul saw it from office. No call needed.</p>
            </div>
            <div className="animate-float-slow absolute -bottom-10 -right-4 hidden w-64 rounded-2xl bg-card p-3 shadow-xl ring-1 ring-line/60 sm:block lg:-right-24">
              <p className="flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-soft text-clay"><ShieldCheck className="h-4 w-4" /></span> Priya suggested a change</p>
              <p className="mt-1 text-xs text-muted">Amlodipine 5 mg → 2.5 mg. <span className="font-semibold text-clay">Baba decides.</span></p>
            </div>
          </div>
        </section>

        {/* ------------------------------ 1-0-1 ------------------------------ */}
        <section aria-labelledby="rx" className="border-y border-line/60 bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <p className="eyebrow">Write it like the doctor does</p>
              <h2 id="rx" className="mt-3 font-display text-4xl leading-tight">From doctor&apos;s shorthand to a daily plan.</h2>
              <p className="mt-4 text-lg text-muted">
                Type the prescription the way Indian doctors write it, or <strong className="font-semibold text-ink">snap a photo and Gemini reads it</strong>. MedSaathi turns it into reminders and counts how many days of tablets are left.
              </p>
            </div>
            <div className="rounded-3xl bg-surface-low p-5 ring-1 ring-line/60 sm:p-7">
              <p className="rounded-2xl border-2 border-dashed border-line bg-card px-5 py-4 font-mono text-lg sm:text-xl">
                Tab. Metformin 500 <span className="rounded bg-due-soft px-1.5 font-bold text-due">1-0-1</span> <span className="text-clay">after food</span>
              </p>
              <div className="my-4 flex items-center gap-2 pl-2 text-sm font-semibold text-primary-soft">
                <Sparkles className="h-5 w-5" aria-hidden /> becomes
              </div>
              <ul className="grid gap-3 sm:grid-cols-3">
                {[
                  { k: "Morning", v: "8:30 AM", on: true },
                  { k: "Afternoon", v: "None", on: false },
                  { k: "Night", v: "9:00 PM", on: true },
                ].map((d) => (
                  <li key={d.k} className={d.on ? "rounded-2xl bg-primary-soft p-4 text-white" : "rounded-2xl border border-line bg-card p-4 text-outline"}>
                    <p className="text-sm opacity-80">{d.k}</p>
                    <p className="text-2xl font-bold">{d.v}</p>
                    {d.on ? <p className="text-sm opacity-80">after food</p> : <p className="text-sm">no dose</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">30 tablets left · <span className="font-semibold text-clay">refill reminder in 10 days</span></p>
            </div>
          </div>
        </section>

        {/* ------------------------------ Escalation ------------------------------ */}
        <section aria-labelledby="ladder" className="relative bg-ink text-white">
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/40 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-5 py-20">
            <p className="text-xs font-bold uppercase tracking-wider text-clay-soft">If a dose is missed</p>
            <h2 id="ladder" className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Reminders that escalate, gently.</h2>
            <p className="mt-4 max-w-2xl text-lg text-white/75">Not spam. Each step happens only if the dose still isn&apos;t marked as taken, so the right person hears at the right time.</p>

            <ol className="mt-12 grid gap-4 md:grid-cols-4">
              {LADDER.map((s, i) => (
                <li key={s.time} className="relative rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${s.tone}`}>{s.time}</span>
                    <span className="font-display text-4xl text-white/20">{i + 1}</span>
                  </div>
                  <p className="mt-4 text-lg font-bold">{s.who}</p>
                  <p className="mt-1 text-white/70">{s.what}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-start gap-2 text-sm text-white/60"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>Real emails via Gmail. Tap <span className="font-semibold text-white">Mark as taken</span> inside the email, no login needed.</span></p>
          </div>
        </section>

        {/* ------------------------------ Principles ------------------------------ */}
        <section aria-labelledby="why" className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Why families pick it</p>
          <h2 id="why" className="mt-3 max-w-2xl font-display text-4xl leading-tight">Built around Baba, not around the app.</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "The elder stays in charge", text: "When family changes a medicine, Baba sees it and says yes or no. Nothing changes behind his back.", tint: "bg-primary-tint text-primary" },
              { icon: MessageCircleHeart, title: "Missed is information", text: "A skipped dose asks why: forgot, unwell, ran out, side effects. The doctor sees patterns, not guilt.", tint: "bg-clay-soft text-clay" },
              { icon: CalendarDays, title: "Visits, sorted", text: "Who takes Baba, what to carry, what to ask, plus a one-page Gemini summary for the doctor.", tint: "bg-due-soft text-due" },
            ].map(({ icon: Icon, title, text, tint }) => (
              <li key={title} className="group rounded-3xl bg-card p-6 ring-1 ring-line/60 transition-transform hover:-translate-y-1">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tint}`}><Icon className="h-7 w-7" aria-hidden /></span>
                <p className="mt-5 text-xl font-bold">{title}</p>
                <p className="mt-2 text-base text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------ Start ------------------------------ */}
        <section aria-labelledby="start" className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-soft to-primary p-8 text-white sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="start" className="font-display text-4xl leading-tight sm:text-5xl">Start your family&apos;s care circle.</h2>
              <p className="mt-4 text-lg text-white/80">Free, takes two minutes, and works on any phone. Everyone joins with one 6-digit Care Code.</p>
            </div>
            <div className="space-y-3">
              <Link href="/start?for=self" className="flex items-center gap-4 rounded-2xl bg-white p-5 text-ink transition-transform hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary"><User className="h-6 w-6" aria-hidden /></span>
                <span className="flex-1"><span className="block text-lg font-bold">For me</span><span className="text-muted">I want to manage my own medicines</span></span>
                <ArrowRight className="h-5 w-5 text-primary-soft" aria-hidden />
              </Link>
              <Link href="/start?for=other" className="flex items-center gap-4 rounded-2xl bg-white p-5 text-ink transition-transform hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay"><Users className="h-6 w-6" aria-hidden /></span>
                <span className="flex-1"><span className="block text-lg font-bold">For someone I care for</span><span className="text-muted">I&apos;m a family member or caretaker</span></span>
                <ArrowRight className="h-5 w-5 text-primary-soft" aria-hidden />
              </Link>
              <Link href="/join" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 p-4 font-semibold hover:bg-white/10">
                <KeyRound className="h-5 w-5" aria-hidden /> I have a Care Code
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 font-bold text-primary"><Mark size={24} /> MedSaathi</p>
          <p>Built with Cloud Firestore · Gemini · Gmail · Google Calendar · Google Maps</p>
        </div>
      </footer>
    </div>
  );
}
