/**
 * All care schedules run on Indian Standard Time. Servers (Vercel, Cloud Run) run on UTC,
 * so every "what time is it for Baba" question goes through these helpers.
 */
export const TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export interface LocalNow {
  date: string;
  minutes: number;
}

export function localNow(now: Date = new Date()): LocalNow {
  const parts = Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  const clamped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Converts a local IST date + HH:mm into an absolute Date. */
export function istInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00${IST_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return localNow(d).date;
}

export function formatTime(time: string): string {
  const mins = toMinutes(time);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(date: string | Date, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }): string {
  const d = typeof date === "string" ? (date.length === 10 ? istInstant(date, "12:00") : new Date(date)) : date;
  return new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, ...opts }).format(d);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} h ago`;
  return formatDateTime(iso);
}

export function slotLabel(time: string): string {
  const m = toMinutes(time);
  if (m < 12 * 60) return "Morning";
  if (m < 17 * 60) return "Afternoon";
  if (m < 20 * 60) return "Evening";
  return "Night";
}
