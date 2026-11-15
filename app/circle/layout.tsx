import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { requireSession } from "@/lib/session";
import { loadProfile, elderName } from "@/lib/care";
import { ROLE_LABEL } from "@/lib/permissions";
import { logout } from "@/app/actions/auth";
import { CircleNav } from "@/components/circle-nav";
import { Avatar } from "@/components/ui";

export default async function CircleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.role === "owner") redirect("/elder");
  const profile = await loadProfile(session.profileId);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-line bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 p-4 lg:block lg:p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xl font-bold text-primary"><HeartPulse className="h-6 w-6" aria-hidden /> MedSaathi</p>
            <form action={logout} className="lg:hidden"><button className="btn-ghost px-3 py-1.5 text-sm">Log out</button></form>
          </div>
          <div className="flex items-center gap-3 rounded-card bg-surface-low p-3 lg:mt-5">
            <Avatar name={profile.name} size="sm" />
            <div className="text-sm">
              <p className="font-bold">{profile.name}</p>
              <p className="text-muted">{elderName(profile)}, {profile.age} yrs</p>
            </div>
          </div>
        </div>
        <nav aria-label="Circle" className="px-3 pb-3 lg:flex-1 lg:px-4">
          <CircleNav />
        </nav>
        <div className="hidden border-t border-line p-4 lg:block">
          <p className="text-sm text-muted">Care Code <span className="font-mono font-bold tracking-widest text-primary">{profile.careCode}</span></p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={session.name} size="sm" tone="clay" />
            <div className="flex-1 text-sm"><p className="font-bold">{session.name}</p><p className="text-muted">{ROLE_LABEL[session.role]}</p></div>
            <form action={logout}><button className="btn-ghost px-3 py-1.5 text-sm">Log out</button></form>
          </div>
        </div>
      </aside>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
