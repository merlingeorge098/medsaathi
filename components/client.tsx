"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Phone, Siren, Volume2, X } from "lucide-react";

/** Submit button that disables itself and announces progress while a server action runs. */
export function SubmitButton({ children, className, pendingText = "Saving...", name, value, ariaLabel }: { children: ReactNode; className?: string; pendingText?: string; name?: string; value?: string; ariaLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-busy={pending} aria-label={ariaLabel} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

/**
 * Bedside help button. Must be held for 3 seconds so a sleepy brush of the screen does nothing.
 * The overlay then counts down 10 seconds and alerts family (never the ambulance) if there's no answer.
 */
export function HoldForHelp({ primaryName, primaryPhone }: { primaryName: string; primaryPhone?: string }) {
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [alerted, setAlerted] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  };
  const start = () => {
    stop();
    const began = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - began) / 3000);
      setProgress(p);
      if (p >= 1) {
        stop();
        setOpen(true);
        setCountdown(10);
        setAlerted(false);
      }
    }, 50);
  };

  useEffect(() => {
    if (!open || alerted) return;
    if (countdown <= 0) {
      setAlerted(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown, alerted]);

  const chime = () => {
    try {
      const ctx = new AudioContext();
      [0, 0.4, 0.8].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.4;
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.3);
      });
    } catch {
      /* audio not available */
    }
  };

  return (
    <>
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !timer.current) start();
        }}
        onKeyUp={stop}
        aria-label="Hold for 3 seconds to ask for help"
        className="relative flex min-h-elder w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-clay-strong px-6 text-elder-body font-bold text-white"
      >
        <span className="absolute inset-y-0 left-0 bg-clay" style={{ width: `${progress * 100}%` }} aria-hidden />
        <Siren className="relative h-7 w-7" aria-hidden />
        <span className="relative">{progress > 0 ? "Keep holding..." : "Hold for help"}</span>
      </button>

      {open ? (
        <div role="alertdialog" aria-modal="true" aria-labelledby="help-title" className="fixed inset-0 z-50 flex flex-col gap-4 overflow-y-auto bg-white p-6">
          <h2 id="help-title" className="text-elder-display text-ink">Getting help</h2>
          <p className="text-elder-body text-muted" aria-live="assertive">
            {alerted ? `${primaryName} and the family have been alerted.` : `If you don't respond, ${primaryName} and the family will be alerted in ${countdown} seconds.`}
          </p>
          <a href={primaryPhone ? `tel:${primaryPhone.replace(/\s/g, "")}` : undefined} className="btn-primary btn-elder text-2xl">
            <Phone className="h-7 w-7" aria-hidden /> Call {primaryName} now
          </a>
          <a href="tel:108" className="btn-danger btn-elder text-2xl">
            <Siren className="h-7 w-7" aria-hidden /> Call 108 Ambulance
          </a>
          <button type="button" onClick={chime} className="btn-outline btn-elder">
            <Volume2 className="h-7 w-7" aria-hidden /> Ring loud chime
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-elder mt-auto border-2 border-ink bg-white text-ink">
            <X className="h-7 w-7" aria-hidden /> I&apos;m okay, cancel
          </button>
        </div>
      ) : null}
    </>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={clsx("btn-outline btn-md")}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/** Speaks the current dose aloud in Hindi or English using the phone's built-in voice. */
export function ReadAloud({ en, hi }: { en: string; hi: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState<"hi" | "en" | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  if (!supported) return null;

  function speak(lang: "hi" | "en") {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking === lang) {
      setSpeaking(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(lang === "hi" ? hi : en);
    utter.lang = lang === "hi" ? "hi-IN" : "en-IN";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang === "hi" ? "hi" : "en-in")) ?? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) utter.voice = voice;
    utter.rate = 0.9;
    utter.onend = () => setSpeaking(null);
    utter.onerror = () => setSpeaking(null);
    setSpeaking(lang);
    synth.speak(utter);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {(["hi", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => speak(lang)}
          aria-pressed={speaking === lang}
          className={clsx("btn min-h-14 border-2 px-4 text-lg", speaking === lang ? "border-primary-soft bg-primary-soft text-white" : "border-primary-soft/40 bg-surface-low text-primary-soft")}
        >
          <Volume2 className="h-6 w-6" aria-hidden />
          <span lang={lang === "hi" ? "hi" : "en"}>{speaking === lang ? (lang === "hi" ? "रोकें" : "Stop") : lang === "hi" ? "सुनिए" : "Read aloud"}</span>
        </button>
      ))}
    </div>
  );
}

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline btn-md print:hidden">
      {label}
    </button>
  );
}
