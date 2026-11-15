import Link from "next/link";
import type { Metadata } from "next";
import { JoinForm } from "@/components/forms";

export const metadata: Metadata = { title: "Join a care circle" };

export default function JoinPage() {
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="text-lg font-bold text-primary">MedSaathi</Link>
      <h1 className="mt-8 text-elder-display">Join a care circle</h1>
      <p className="mb-8 mt-2 text-elder-body text-muted">Ask your family member for their 6-digit Care Code.</p>
      <JoinForm />
    </main>
  );
}
