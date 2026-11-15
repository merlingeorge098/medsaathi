import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BellRing, CalendarDays, Camera, HeartPulse, KeyRound, Mail, ShieldCheck, User, Users } from "lucide-react";
import { demoLogin } from "./actions/auth";
import { getSession } from "@/lib/session";
import { SubmitButton } from "@/components/client";
import familyGarden from "../public/images/family-garden.jpg";
import pillsAtHome from "../public/images/pills-at-home.jpg";
import grandfatherGrandson from "../public/images/grandfather-grandson.jpg";
import appElder from "../public/images/app-elder.jpg";
import appCircle from "../public/images/app-circle.jpg";

const LADDER = [
  { time: "10 min before", who: "Baba", what: "A gentle heads-up that a dose is coming." },
  { time: "At dose time", who: "Baba", what: "“Time for your medicine”, with one-tap buttons." },
  { time: "+30 min", who: "Primary caretaker", what: "An email with Mark as taken and Snooze inside it." },
  { time: "+60 min", who: "Whole family", what: "Everyone is told, so someone can call or visit." },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "owner" ? "/elder" : "/circle");

  return (
    <>
      <main id="main">
        {/* Hero: full-bleed photo */}
        <section className="relative isolate flex min-h-[92vh] flex-col overflow-hidden bg-ink text-white">
          <div className="absolute inset-0 -z-10 lg:left-[38%]">
            <Image
              src={familyGarden}
              alt="Grandparents laughing with their grandchild in a garden"
              priority
              placeholder="blur"
              fill
              sizes="(min-width: 1024px) 62vw, 100vw"
              className="object-cover"
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/20 lg:bg-gradient-to-r lg:from-ink lg:from-[38%] lg:via-ink/20 lg:via-[52%] lg:to-transparent" />

          <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
            <p className="flex items-center gap-2 text-xl font-bold">
              <HeartPulse className="h-6 w-6 text-primary-tint" aria-hidden /> MedSaathi
            </p>
            <nav aria-label="Account" className="flex items-center gap-2">
              <Link href="/join" className="hidden rounded-full px-4 py-2 font-semibold text-white/90 hover:bg-white/10 sm:inline-flex">I have a Care Code</Link>
              <Link href="/login" className="rounded-full border-2 border-white/80 px-5 py-2 font-semibold hover:bg-white hover:text-ink">Log in</Link>
            </nav>
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1 items-end px-6 pb-12 pt-24 lg:items-center lg:pb-20">
            <div className="max-w-2xl">
              <p className="text-lg font-semibold text-clay-soft">Medicine care for elders and their families</p>
              <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Dawa time pe, parivaar saath mein.
              </h1>
              <p className="mt-6 max-w-xl text-elder-body text-white/85">
                Reminders, medicines and doctor visits for your parents, shared with the whole family. <span className="font-bold text-white">The family helps. The elder decides.</span>
              </p>
              <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-2">
                <form action={demoLogin}>
                  <input type="hidden" name="as" value="elder" />
                  <SubmitButton className="btn btn-elder bg-clay-strong text-white hover:bg-clay" pendingText="Opening...">See Baba&apos;s view <ArrowRight className="h-5 w-5" aria-hidden /></SubmitButton>
                </form>
                <form action={demoLogin}>
                  <input type="hidden" name="as" value="family" />
                  <SubmitButton className="btn btn-elder border-2 border-white text-white hover:bg-white hover:text-ink" pendingText="Opening...">See Rahul&apos;s view</SubmitButton>
                </form>
              </div>
              <p className="mt-4 text-sm text-white/70">Opens a demo family with 30 days of history. Care Code 482915, elder PIN 1234.</p>
            </div>
          </div>

          <div className="border-t border-white/15 bg-ink/40">
            <ul className="mx-auto grid max-w-6xl gap-4 px-6 py-5 text-base font-semibold sm:grid-cols-3">
              <li className="flex items-center gap-3"><Camera className="h-5 w-5 shrink-0 text-clay-soft" aria-hidden /> Snap a prescription, Gemini reads it</li>
              <li className="flex items-center gap-3"><BellRing className="h-5 w-5 shrink-0 text-clay-soft" aria-hidden /> Missed dose? The family is emailed</li>
              <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-clay-soft" aria-hidden /> Baba approves every change</li>
            </ul>
          </div>
        </section>

        {/* Real product on deep teal */}
        <section aria-labelledby="product" className="bg-primary text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="grid gap-6 md:grid-cols-2 md:items-end">
              <h2 id="product" className="text-4xl font-bold tracking-tight sm:text-5xl">One profile.<br />Two views.</h2>
              <p className="text-lg text-white/80">Baba sees one thing at a time, in large text. The family sees everything at a glance. Same data, kept in sync.</p>
            </div>
            <div className="mt-12 grid items-start gap-8 md:grid-cols-[1fr_2.4fr]">
              <figure>
                <Image src={appElder} alt="Elder Mode on a phone: greeting, a pending approval from Rahul, and today's medicine" placeholder="blur" sizes="(min-width: 768px) 300px, 100vw" className="w-full rounded-2xl shadow-2xl shadow-black/30" />
                <figcaption className="mt-4"><span className="font-bold">Elder Mode</span> <span className="text-white/70">· big buttons, one action at a time</span></figcaption>
              </figure>
              <figure>
                <Image src={appCircle} alt="Circle Mode dashboard: today's doses, 7-day adherence, next visit, refill warning and timeline" placeholder="blur" sizes="(min-width: 768px) 760px, 100vw" className="w-full rounded-2xl shadow-2xl shadow-black/30" />
                <figcaption className="mt-4"><span className="font-bold">Circle Mode</span> <span className="text-white/70">· doses, adherence, visits and refills</span></figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Prescriptions on warm cream */}
        <section aria-labelledby="rx" className="bg-[#fbf1e8]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-24 lg:gap-16">
            <Image src={pillsAtHome} alt="An elderly man sorting tablets into a pill organiser at home" placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="aspect-square w-full rounded-2xl object-cover" />
            <div>
              <p className="text-base font-bold text-clay">Prescriptions</p>
              <h2 id="rx" className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Write it the way the doctor does.</h2>
              <p className="mt-5 text-lg text-muted">Type it as Indian doctors write it, or take a photo and Gemini reads it. MedSaathi turns it into a daily schedule and counts the tablets left.</p>
              <dl className="mt-8 divide-y divide-clay/15 rounded-2xl bg-card shadow-sm ring-1 ring-clay/15">
                <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-muted">You type</dt>
                  <dd className="font-mono text-lg font-bold">Metformin 500, <span className="rounded bg-clay-soft px-1.5 text-clay">1-0-1</span>, after food</dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-muted">Reminders</dt>
                  <dd className="text-lg font-bold">8:30 AM and 9:00 PM</dd>
                </div>
                <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-muted">Refill</dt>
                  <dd className="text-lg font-bold text-clay">Warned 5 days before it runs out</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Elder decides */}
        <section aria-labelledby="decides" className="bg-card">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-24 lg:gap-16">
            <div className="md:order-2">
              <Image src={grandfatherGrandson} alt="A grandfather feeding his grandson" placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="aspect-square w-full rounded-2xl object-cover" />
            </div>
            <div className="md:order-1">
              <p className="text-base font-bold text-primary-soft">Dignity first</p>
              <h2 id="decides" className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">The elder decides.</h2>
              <p className="mt-5 text-lg text-muted">Family can suggest. Only Baba applies. Every change is a request he approves, and every action is logged with who made it.</p>
              <ul className="mt-8 space-y-6">
                {[
                  { icon: ShieldCheck, title: "Medicine changes need his yes", text: "Rahul suggests a new dose. Baba sees it in plain words and says yes or no." },
                  { icon: Users, title: "He chooses who joins", text: "New family members wait until Baba lets them in and picks their role." },
                  { icon: CalendarDays, title: "Ready for the doctor", text: "Visits with a carry list, questions to ask and a Gemini summary of the month." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-white"><Icon className="h-6 w-6" aria-hidden /></span>
                    <span>
                      <span className="block text-lg font-bold">{title}</span>
                      <span className="text-base text-muted">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Escalation on ink */}
        <section aria-labelledby="ladder" className="bg-ink text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="grid gap-6 md:grid-cols-2 md:items-end">
              <h2 id="ladder" className="text-4xl font-bold tracking-tight sm:text-5xl">When a dose is missed.</h2>
              <p className="text-lg text-white/75">Each step only happens if the dose still isn&apos;t marked as taken. The right person hears at the right time, and nobody gets spammed.</p>
            </div>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/15 md:grid-cols-4">
              {LADDER.map((s, i) => (
                <li key={s.time} className="bg-ink p-6 md:p-7">
                  <p className="text-6xl font-bold leading-none text-clay-strong">{i + 1}</p>
                  <p className="mt-5 text-sm font-bold uppercase tracking-wider text-white/60">{s.time}</p>
                  <p className="mt-1 text-xl font-bold">{s.who}</p>
                  <p className="mt-2 text-white/70">{s.what}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 text-white/70"><Mail className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> Sent by Gmail. The buttons inside the email work without logging in.</p>
          </div>
        </section>

        {/* Start on terracotta */}
        <section aria-labelledby="start" className="bg-clay text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-24 lg:gap-16">
            <div>
              <h2 id="start" className="text-4xl font-bold tracking-tight sm:text-5xl">Start your family&apos;s care circle.</h2>
              <p className="mt-5 text-lg text-white/85">Free, and works on any phone. The whole family joins with one 6-digit Care Code.</p>
            </div>
            <div className="space-y-3">
              <Link href="/start?for=self" className="flex items-center gap-4 rounded-2xl bg-white p-5 text-ink transition-transform hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary"><User className="h-6 w-6" aria-hidden /></span>
                <span className="flex-1"><span className="block text-lg font-bold">For me</span><span className="text-muted">I want to manage my own medicines</span></span>
                <ArrowRight className="h-5 w-5 text-clay" aria-hidden />
              </Link>
              <Link href="/start?for=other" className="flex items-center gap-4 rounded-2xl bg-white p-5 text-ink transition-transform hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay"><Users className="h-6 w-6" aria-hidden /></span>
                <span className="flex-1"><span className="block text-lg font-bold">For someone I care for</span><span className="text-muted">I&apos;m a family member or caretaker</span></span>
                <ArrowRight className="h-5 w-5 text-clay" aria-hidden />
              </Link>
              <Link href="/join" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-white/60 p-4 font-semibold hover:bg-white/10">
                <KeyRound className="h-5 w-5" aria-hidden /> I have a Care Code
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm md:flex-row md:justify-between">
          <p><span className="font-bold text-white">MedSaathi</span> · Built with Cloud Firestore, Gemini, Gmail, Google Calendar and Google Maps</p>
          <p>Photos from <a className="underline hover:text-white" href="https://www.pexels.com" rel="noopener noreferrer" target="_blank">Pexels</a></p>
        </div>
      </footer>
    </>
  );
}
