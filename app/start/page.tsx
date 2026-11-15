import Link from "next/link";
import type { Metadata } from "next";
import { CreateProfileForm } from "@/components/forms";

export const metadata: Metadata = { title: "Create a care circle" };

export default async function StartPage({ searchParams }: { searchParams: Promise<{ for?: string }> }) {
  const forWhom = (await searchParams).for === "self" ? "self" : "other";
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-10">
      <Link href="/" className="text-lg font-bold text-primary">
        MedSaathi
      </Link>
      <h1 className="mt-8 text-elder-display">
        {forWhom === "self" ? "Set up your care circle" : "Set up care for someone you love"}
      </h1>
      <p className="mb-8 mt-2 text-elder-body text-muted">
        You&apos;ll get a 6-digit Care Code. Share it with family, and {forWhom === "self" ? "you" : "they"} decide what
        each person can do.
      </p>
      <CreateProfileForm forWhom={forWhom} />
    </main>
  );
}
