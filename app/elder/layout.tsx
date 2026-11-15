import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse, Stethoscope, Sun, Users } from "lucide-react";
import { requireSession } from "@/lib/session";
import { loadProfile, elderName } from "@/lib/care";
import { logout } from "@/app/actions/auth";

export default async function ElderLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/circle");
  const profile = await loadProfile(session.profileId);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-surface">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-surface/95 px-5 py-3 backdrop-blur">
        <p className="flex items-center gap-2 text-lg font-bold text-primary">
          <HeartPulse className="h-6 w-6" aria-hidden /> MedSaathi
        </p>
        <form action={logout}>
          <button className="btn-ghost px-3 py-2 text-base" aria-label={`Log out ${elderName(profile)}`}>
            Log out
          </button>
        </form>
      </header>
      <main id="main" className="flex-1 px-5 pb-32 pt-5">
        {children}
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-3">
          {[
            { href: "/elder", label: "Today", icon: Sun },
            { href: "/elder/doctor", label: "Doctor", icon: Stethoscope },
            { href: "/elder/family", label: "My Family", icon: Users },
          ].map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-[72px] flex-col items-center justify-center gap-1 text-lg font-semibold text-primary-soft"
              >
                <Icon className="h-7 w-7" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
