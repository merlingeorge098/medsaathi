import Link from "next/link";
import { BatteryLow, Brain, Frown, ThermometerSun } from "lucide-react";
import { skipDose } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";

const REASONS = [
  { value: "forgot", label: "I forgot earlier", icon: Brain },
  { value: "unwell", label: "I feel unwell", icon: ThermometerSun },
  { value: "finished", label: "Medicine is finished", icon: BatteryLow },
  { value: "side_effects", label: "It makes me feel bad", icon: Frown },
] as const;

export default async function SkipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-elder-display">That&apos;s okay. Why not now?</h1>
      <form action={skipDose} className="grid grid-cols-2 gap-3">
        <input type="hidden" name="medicationId" value={p.med ?? ""} />
        <input type="hidden" name="date" value={p.date ?? ""} />
        <input type="hidden" name="time" value={p.time ?? ""} />
        {REASONS.map(({ value, label, icon: Icon }) => (
          <SubmitButton
            key={value}
            name="reason"
            value={value}
            pendingText="Saving..."
            className="card flex min-h-[150px] flex-col items-center justify-center gap-3 p-4 text-center text-elder-body font-semibold hover:border-primary-soft"
          >
            <Icon className="h-10 w-10 text-primary-soft" aria-hidden />
            {label}
          </SubmitButton>
        ))}
      </form>
      <p className="text-center text-elder-body text-muted">Your family will be told so they can help.</p>
      <Link href="/elder" className="btn-ghost btn-elder">
        Go back
      </Link>
    </div>
  );
}
