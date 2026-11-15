import clsx from "clsx";
import { AlertCircle, Check, Clock, MinusCircle, MoonStar } from "lucide-react";
import type { ReactNode } from "react";
import type { DoseDisplayStatus } from "@/lib/escalation";
import { initials } from "@/lib/format";

const PILL_COLORS: Record<string, string> = {
  white: "#f7f7f2",
  yellow: "#f3d36b",
  pink: "#f2a7b8",
  orange: "#f0a35e",
  blue: "#8fb8e8",
  red: "#d9534f",
  green: "#9fd3a5",
  brown: "#b98b5f",
};

/** A drawn tablet, so elders recognise medicines by look. Decorative: the name is always shown beside it. */
export function PillArt({ shape = "Round", color = "White", size = 64 }: { shape?: string; color?: string; size?: number }) {
  const fill = PILL_COLORS[color.toLowerCase()] ?? "#f7f7f2";
  const s = shape.toLowerCase();
  return (
    <div className="flex shrink-0 items-center justify-center rounded-2xl bg-surface-high" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size * 0.7} height={size * 0.7}>
        {s === "capsule" ? (
          <g transform="rotate(-30 32 32)">
            <rect x="10" y="22" width="44" height="20" rx="10" fill={fill} stroke="#6f7977" strokeWidth="1.5" />
            <path d="M32 22h12a10 10 0 0 1 0 20H32z" fill="#1e6b62" opacity="0.85" />
          </g>
        ) : s === "oval" ? (
          <ellipse cx="32" cy="32" rx="24" ry="15" fill={fill} stroke="#6f7977" strokeWidth="1.5" />
        ) : (
          <>
            <circle cx="32" cy="32" r="20" fill={fill} stroke="#6f7977" strokeWidth="1.5" />
            <line x1="20" y1="32" x2="44" y2="32" stroke="#6f7977" strokeWidth="1.2" opacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}

const STATUS: Record<DoseDisplayStatus, { label: string; className: string; icon: ReactNode }> = {
  taken: { label: "Taken", className: "bg-taken-soft text-taken", icon: <Check className="h-4 w-4" aria-hidden /> },
  skipped: { label: "Skipped", className: "bg-missed-soft text-missed", icon: <MinusCircle className="h-4 w-4" aria-hidden /> },
  missed: { label: "Missed", className: "bg-missed-soft text-missed", icon: <AlertCircle className="h-4 w-4" aria-hidden /> },
  due: { label: "Due", className: "bg-due-soft text-due", icon: <Clock className="h-4 w-4" aria-hidden /> },
  snoozed: { label: "Snoozed", className: "bg-due-soft text-due", icon: <MoonStar className="h-4 w-4" aria-hidden /> },
  upcoming: { label: "Later", className: "bg-surface-high text-muted", icon: <Clock className="h-4 w-4" aria-hidden /> },
};

/** Status is always shown with an icon and a word, never colour alone. */
export function StatusBadge({ status, detail }: { status: DoseDisplayStatus; detail?: string }) {
  const s = STATUS[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", s.className)}>
      {s.icon}
      {s.label}
      {detail ? <span className="font-normal">{detail}</span> : null}
    </span>
  );
}

export function Avatar({ name, size = "md", tone = "teal" }: { name: string; size?: "sm" | "md" | "lg"; tone?: "teal" | "clay" }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        tone === "teal" ? "bg-primary-tint text-primary" : "bg-clay-soft text-clay",
        size === "sm" && "h-9 w-9 text-sm",
        size === "md" && "h-11 w-11 text-base",
        size === "lg" && "h-20 w-20 text-2xl",
      )}
    >
      {initials(name)}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warn" | "error"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-card border px-4 py-3 text-base",
        tone === "info" && "border-primary-tint bg-surface-low text-primary",
        tone === "success" && "border-taken/30 bg-taken-soft text-taken",
        tone === "warn" && "border-due/30 bg-due-soft text-due",
        tone === "error" && "border-missed/30 bg-missed-soft text-missed",
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
