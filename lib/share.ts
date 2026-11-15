import { formatTime } from "./time";
import type { DoseDisplayStatus } from "./escalation";

interface ShareDose {
  time: string;
  status: DoseDisplayStatus;
  medication: { name: string; strength?: string };
}

const MARK: Record<DoseDisplayStatus, string> = {
  taken: "✅",
  due: "⏰",
  snoozed: "⏰",
  missed: "❌",
  skipped: "⏭️",
  upcoming: "🕒",
};

/** Plain-text daily update for the family WhatsApp group. */
export function dailyUpdateText(elderName: string, dateLabel: string, doses: ShareDose[], appUrl: string): string {
  const taken = doses.filter((d) => d.status === "taken").length;
  const lines = [...doses]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((d) => `${MARK[d.status]} ${formatTime(d.time)} ${d.medication.name}${d.medication.strength ? ` ${d.medication.strength}` : ""}`);
  return [
    `*${elderName}'s medicines, ${dateLabel}*`,
    `${taken} of ${doses.length} taken so far`,
    "",
    ...lines,
    "",
    `Open MedSaathi: ${appUrl}`,
  ].join("\n");
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
