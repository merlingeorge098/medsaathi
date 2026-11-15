import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="text-lg font-bold text-primary">MedSaathi</Link>
      <h1 className="mt-8 text-elder-display">Namaste</h1>
      <p className="mb-8 mt-2 text-elder-body text-muted">Log in with your family&apos;s Care Code.</p>
      <LoginForm />
      <p className="mt-6 text-center text-base text-muted">
        New to a circle? <Link href="/join" className="font-semibold text-primary underline">Join with a Care Code</Link>
      </p>
    </main>
  );
}
