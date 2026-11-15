"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Activity, BarChart3, BellRing, CalendarDays, Contact, LayoutDashboard, Pill, Users } from "lucide-react";

export const CIRCLE_NAV = [
  { href: "/circle", label: "Today", icon: LayoutDashboard },
  { href: "/circle/medicines", label: "Medicines", icon: Pill },
  { href: "/circle/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/circle/adherence", label: "Adherence", icon: BarChart3 },
  { href: "/circle/members", label: "Care circle", icon: Users },
  { href: "/circle/reminders", label: "Reminders", icon: BellRing },
  { href: "/circle/activity", label: "Activity", icon: Activity },
  { href: "/circle/emergency", label: "Emergency card", icon: Contact },
];

export function CircleNav() {
  const path = usePathname();
  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col">
      {CIRCLE_NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/circle" ? path === href : path.startsWith(href);
        return (
          <li key={href} className="shrink-0">
            <Link href={href} aria-current={active ? "page" : undefined} className={clsx("flex items-center gap-3 rounded-full px-4 py-2.5 text-base font-semibold", active ? "bg-primary-soft text-white" : "text-muted hover:bg-surface-high")}>
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
