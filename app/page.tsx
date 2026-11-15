import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BellRing, CalendarDays, Camera, Check, HeartPulse, KeyRound, Mail, Menu, MessageCircle, ShieldCheck, User, Users, Volume2, X } from "lucide-react";
import { demoLogin } from "./actions/auth";
import { getSession } from "@/lib/session";
import { SubmitButton } from "@/components/client";
import familyGarden from "../public/images/family-garden.jpg";
import pillsAtHome from "../public/images/pills-at-home.jpg";
import grandfatherGrandson from "../public/images/grandfather-grandson.jpg";
import appElder from "../public/images/app-elder.jpg";
import appCircle from "../public/images/app-circle.jpg";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#rx", label: "Prescriptions" },
  { href: "#decides", label: "Elder first" },
  { href: "#ladder", label: "Reminders" },
];

const LADDER = [
  { time: "10 min before", who: "Baba", what: "A gentle heads-up that a dose is coming." },
  { time: "At dose time", who: "Baba", what: "“Time for your medicine”, read aloud if he likes." },
  { time: "+30 min", who: "Primary caretaker", what: "An email with Mark as taken and Snooze inside it." },
  { time: "+60 min", who: "Whole family", what: "Everyone is told, so someone can call or visit." },
];

const EXTRAS = [
  { icon: Volume2, title: "Hears it in Hindi", text: "One tap reads the dose aloud in Hindi or English." },
  { icon: MessageCircle, title: "WhatsApp update", text: "Send the day's doses to the family group in one tap." },
  { icon: Camera, title: "Photo prescriptions", text: "Snap the doctor's slip and the schedule fills itself." },
  { icon: CalendarDays, title: "Doctor visits", text: "Carry list, questions to ask, Calendar and Maps links." },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "owner" ? "/elder" : "/circle");

  return (
    <div className="bg-white text-ink">
      <header className="sticky top-0 z-40 border-b border-line/50 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <HeartPulse className="h-6 w-6 text-primary-soft" aria-hidden /> MedSaathi
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-4 py-2 text-base font-semibold text-muted transition-colors hover:bg-surface-low hover:text-primary">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 font-semibold text-primary-soft hover:bg-surface-low sm:inline-flex">Log in</Link>
            <Link href="/start?for=other" className="hidden rounded-full bg-primary-soft px-5 py-2 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary sm:inline-flex">Get started</Link>
            <details className="group relative lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full text-primary hover:bg-surface-low [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <Menu className="h-6 w-6 group-open:hidden" aria-hidden />
                <X className="hidden h-6 w-6 group-open:block" aria-hidden />
              </summary>
              <div className="absolute right-0 top-14 w-64 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-line/60">
                {NAV.map((n) => (
                  <a key={n.href} href={n.href} className="block rounded-xl px-4 py-3 font-semibold hover:bg-surface-low">{n.label}</a>
                ))}
                <div className="my-2 border-t border-line/60" />
                <Link href="/login" className="block rounded-xl px-4 py-3 font-semibold hover:bg-surface-low">Log in</Link>
                <Link href="/join" className="block rounded-xl px-4 py-3 font-semibold hover:bg-surface-low">I have a Care Code</Link>
                <Link href="/start?for=other" className="mt-1 block rounded-xl bg-primary-soft px-4 py-3 text-center font-semibold text-white">Get started</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-low via-white to-white">
          <div aria-hidden="true" className="anim-drift pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-tint/40 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
            <div>
              <h1 className="anim-fade-up text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Dawa time pe, <span className="text-primary-soft">parivaar saath mein.</span>
              </h1>
              <p className="anim-fade-up delay-2 mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                Reminders, medicines and doctor visits for your parents, shared with the whole family. <strong className="font-semibold text-ink">The family helps. The elder decides.</strong>
              </p>
              <div className="anim-fade-up delay-3 mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <form action={demoLogin}>
                  <input type="hidden" name="as" value="elder" />
                  <SubmitButton className="btn min-h-14 w-full bg-primary-soft px-6 text-lg text-white shadow-lg shadow-primary-soft/25 transition hover:-translate-y-0.5 hover:bg-primary" pendingText="Opening...">
                    See Baba&apos;s view <ArrowRight className="h-5 w-5" aria-hidden />
                  </SubmitButton>
                </form>
                <form action={demoLogin}>
                  <input type="hidden" name="as" value="family" />
                  <SubmitButton className="btn min-h-14 w-full border-2 border-primary-soft/30 bg-white px-6 text-lg text-primary-soft transition hover:-translate-y-0.5 hover:border-primary-soft" pendingText="Opening...">
                    See Rahul&apos;s view
                  </SubmitButton>
                </form>
              </div>
              <p className="anim-fade-up delay-4 mt-3 text-sm text-outline">Opens a demo family with 30 days of history. Care Code 482915, elder PIN 1234.</p>
              <ul className="anim-fade-up delay-4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-base text-muted">
                {["Elder approves every change", "Email alerts for missed doses", "Works on any phone"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="h-5 w-5 text-taken" aria-hidden /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="anim-zoom delay-2 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-primary/15 ring-1 ring-black/5">
              <Image
                src={familyGarden}
                alt="Grandparents laughing with their grandchild in a garden"
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 600px, 100vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Product */}
        <section aria-labelledby="product" className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
            <div className="reveal max-w-2xl">
              <p className="text-base font-bold text-clay">The product</p>
              <h2 id="product" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">One profile. Two views.</h2>
              <p className="mt-4 text-lg text-muted">Baba sees one thing at a time, in large text. The family sees everything at a glance. Same data, always in sync.</p>
            </div>
            <div className="mt-10 grid items-start gap-6 md:grid-cols-[1fr_2.4fr] md:gap-8">
              <figure className="reveal">
                <div className="rounded-[1.75rem] bg-surface-low p-3 ring-1 ring-line/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <Image src={appElder} alt="Elder Mode on a phone: greeting, a pending approval from Rahul, and today's medicine" placeholder="blur" sizes="(min-width: 768px) 300px, 100vw" className="w-full rounded-2xl" />
                </div>
                <figcaption className="mt-3 text-base"><span className="font-bold">Elder Mode</span> <span className="text-muted">· big buttons, one action at a time</span></figcaption>
              </figure>
              <figure className="reveal">
                <div className="rounded-[1.75rem] bg-surface-low p-3 ring-1 ring-line/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <Image src={appCircle} alt="Circle Mode dashboard: today's doses, 7-day adherence, next visit, refill warning and timeline" placeholder="blur" sizes="(min-width: 768px) 760px, 100vw" className="w-full rounded-2xl" />
                </div>
                <figcaption className="mt-3 text-base"><span className="font-bold">Circle Mode</span> <span className="text-muted">· doses, adherence, visits and refills</span></figcaption>
              </figure>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXTRAS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="reveal rounded-2xl bg-white p-5 ring-1 ring-line/60 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary-soft/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint/60 text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
                  <p className="mt-4 text-lg font-bold">{title}</p>
                  <p className="mt-1 text-base text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Prescriptions */}
        <section aria-labelledby="rx" className="bg-[#fdf6ef]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:gap-16">
            <div className="reveal overflow-hidden rounded-[1.75rem] shadow-xl shadow-clay/10">
              <Image src={pillsAtHome} alt="An elderly man sorting tablets into a pill organiser at home" placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105 md:aspect-square" />
            </div>
            <div className="reveal">
              <p className="text-base font-bold text-clay">Prescriptions</p>
              <h2 id="rx" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Write it the way the doctor does.</h2>
              <p className="mt-4 text-lg text-muted">Type it as Indian doctors write it, or just take a photo of it. MedSaathi turns it into a daily schedule and counts the tablets left.</p>
              <dl className="mt-8 divide-y divide-clay/10 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay/15">
                {[
                  { k: "You type", v: <span className="font-mono">Metformin 500, <span className="rounded bg-clay-soft px-1.5 text-clay">1-0-1</span>, after food</span> },
                  { k: "Reminders", v: "8:30 AM and 9:00 PM" },
                  { k: "Refill", v: <span className="text-clay">Warned 5 days before it runs out</span> },
                ].map((row) => (
                  <div key={row.k} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <dt className="text-muted">{row.k}</dt>
                    <dd className="text-lg font-bold">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Elder decides */}
        <section aria-labelledby="decides" className="bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:gap-16">
            <div className="reveal overflow-hidden rounded-[1.75rem] shadow-xl shadow-primary/10 md:order-2">
              <Image src={grandfatherGrandson} alt="A grandfather feeding his grandson" placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105 md:aspect-square" />
            </div>
            <div className="reveal md:order-1">
              <p className="text-base font-bold text-clay">Dignity first</p>
              <h2 id="decides" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">The elder decides.</h2>
              <p className="mt-4 text-lg text-muted">Family can suggest. Only Baba applies. Every change is a request he approves, and every action is logged with who made it.</p>
              <ul className="mt-8 space-y-5">
                {[
                  { icon: ShieldCheck, title: "Medicine changes need his yes", text: "Rahul suggests a new dose. Baba sees it in plain words and says yes or no." },
                  { icon: Users, title: "He chooses who joins", text: "New family members wait until Baba lets them in and picks their role." },
                  { icon: CalendarDays, title: "Ready for the doctor", text: "A carry list, questions to ask and a one-page summary of the month." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint/60 text-primary"><Icon className="h-6 w-6" aria-hidden /></span>
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

        {/* Escalation */}
        <section aria-labelledby="ladder" className="bg-surface-low">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
            <div className="reveal max-w-2xl">
              <p className="flex items-center gap-2 text-base font-bold text-clay"><BellRing className="h-5 w-5" aria-hidden /> Reminders</p>
              <h2 id="ladder" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">When a dose is missed.</h2>
              <p className="mt-4 text-lg text-muted">Each step only happens if the dose still isn&apos;t marked as taken. The right person hears at the right time, and nobody gets spammed.</p>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LADDER.map((s, i) => (
                <li key={s.time} className="reveal relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line/50 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-soft text-lg font-bold text-clay">{i + 1}</span>
                  <p className="mt-4 text-sm font-bold uppercase tracking-wider text-outline">{s.time}</p>
                  <p className="mt-1 text-xl font-bold">{s.who}</p>
                  <p className="mt-2 text-muted">{s.what}</p>
                </li>
              ))}
            </ol>
            <p className="reveal mt-6 flex items-start gap-2 text-muted"><Mail className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> Sent by Gmail. The buttons inside the email work without logging in.</p>
          </div>
        </section>

        {/* Start */}
        <section aria-labelledby="start" className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 md:py-24">
            <div className="reveal grid items-center gap-8 rounded-[2rem] bg-gradient-to-br from-primary-tint/60 via-surface-low to-clay-soft/60 p-7 ring-1 ring-line/40 sm:p-12 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 id="start" className="text-3xl font-bold tracking-tight sm:text-4xl">Start your family&apos;s care circle.</h2>
                <p className="mt-4 text-lg text-muted">Free, and works on any phone. The whole family joins with one 6-digit Care Code.</p>
              </div>
              <div className="space-y-3">
                {[
                  { href: "/start?for=self", icon: User, tint: "bg-primary-tint text-primary", title: "For me", text: "I want to manage my own medicines" },
                  { href: "/start?for=other", icon: Users, tint: "bg-clay-soft text-clay", title: "For someone I care for", text: "I'm a family member or caretaker" },
                ].map(({ href, icon: Icon, tint, title, text }) => (
                  <Link key={href} href={href} className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line/50 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tint}`}><Icon className="h-6 w-6" aria-hidden /></span>
                    <span className="flex-1"><span className="block text-lg font-bold">{title}</span><span className="text-muted">{text}</span></span>
                    <ArrowRight className="h-5 w-5 text-primary-soft transition group-hover:translate-x-1" aria-hidden />
                  </Link>
                ))}
                <Link href="/join" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-primary-soft/30 bg-white/60 p-4 font-semibold text-primary-soft transition hover:border-primary-soft">
                  <KeyRound className="h-5 w-5" aria-hidden /> I have a Care Code
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/50 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:px-6 md:flex-row md:justify-between">
          <p><span className="font-bold text-primary">MedSaathi</span> · Works with Gmail, Google Calendar and Google Maps</p>
          <p>Photos from <a className="underline hover:text-primary" href="https://www.pexels.com" rel="noopener noreferrer" target="_blank">Pexels</a></p>
        </div>
      </footer>
    </div>
  );
}
