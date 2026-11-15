import { Frown, Meh, Smile } from "lucide-react";
import { checkIn } from "@/app/actions/care";
import { SubmitButton } from "@/components/client";

export default function CheckInPage() {
  return (
    <form action={checkIn} className="space-y-6">
      <h1 className="text-elder-display">How are you feeling today?</h1>
      <label className="block">
        <span className="text-elder-body font-semibold">Anything to tell your family? (optional)</span>
        <textarea
          name="note"
          rows={3}
          maxLength={300}
          className="field mt-2 text-elder-body"
          placeholder="Thoda thakan hai..."
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: "good", l: "Good", I: Smile, c: "text-taken" },
          { v: "okay", l: "Okay", I: Meh, c: "text-due" },
          { v: "unwell", l: "Not well", I: Frown, c: "text-missed" },
        ].map(({ v, l, I, c }) => (
          <SubmitButton
            key={v}
            name="mood"
            value={v}
            pendingText="..."
            className="card flex min-h-[140px] flex-col items-center justify-center gap-2 text-elder-body font-bold"
          >
            <I className={`h-14 w-14 ${c}`} aria-hidden />
            {l}
          </SubmitButton>
        ))}
      </div>
      <p className="text-base text-muted">
        If you choose &quot;Not well&quot;, your family gets an email straight away.
      </p>
    </form>
  );
}
