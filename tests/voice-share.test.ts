import { describe, expect, it } from "vitest";
import { doseSpeech, nextDoseSpeech } from "@/lib/voice";

describe("read-aloud when nothing is due", () => {
  it("announces the next dose", () => {
    const s = nextDoseSpeech("Baba", { medicine: "Atorvastatin", strength: "10 mg", time: "9:00 PM" });
    expect(s.en).toBe("Baba ji, there is nothing to take right now. Your next medicine is Atorvastatin 10 mg, at 9:00 PM.");
    expect(s.hi).toContain("अगली दवा Atorvastatin 10 mg");
  });

  it("congratulates when the day is complete", () => {
    expect(nextDoseSpeech("Baba").en).toContain("all your medicines for today are done");
    expect(nextDoseSpeech("Baba").hi).toContain("शाबाश");
  });
});
import { dailyUpdateText, whatsappLink } from "@/lib/share";

describe("read-aloud dose speech", () => {
  it("speaks the dose in English and Hindi", () => {
    const s = doseSpeech({ elderName: "Baba", medicine: "Amlodipine", strength: "5 mg", tablets: 1, food: "after" });
    expect(s.en).toBe("Baba ji, it is time for your medicine. Please take 1 tablet of Amlodipine 5 mg after your meal, with a full glass of water.");
    expect(s.hi).toContain("Baba जी");
    expect(s.hi).toContain("Amlodipine 5 mg की 1 गोली");
    expect(s.hi).toContain("खाना खाने के बाद");
  });

  it("handles plural tablets, before food and no food rule", () => {
    expect(doseSpeech({ elderName: "Aai", medicine: "Metformin", tablets: 2, food: "before" }).en).toContain("2 tablets of Metformin before your meal");
    const any = doseSpeech({ elderName: "Aai", medicine: "Vitamin D", tablets: 1, food: "any" });
    expect(any.en).not.toMatch(/meal/);
    expect(any.hi).not.toContain("खाना");
  });

  it("never says zero tablets", () => {
    expect(doseSpeech({ elderName: "Baba", medicine: "X", tablets: 0, food: "any" }).en).toContain("1 tablet of X");
  });
});

describe("WhatsApp daily update", () => {
  const doses = [
    { time: "21:00", status: "upcoming" as const, medication: { name: "Atorvastatin", strength: "10 mg" } },
    { time: "08:30", status: "taken" as const, medication: { name: "Metformin", strength: "500 mg" } },
    { time: "14:00", status: "missed" as const, medication: { name: "Amlodipine" } },
  ];

  it("lists doses in time order with status marks and a count", () => {
    const text = dailyUpdateText("Baba", "Sunday, 15 November", doses, "https://medsaathi.example");
    expect(text.split("\n")).toEqual([
      "*Baba's medicines, Sunday, 15 November*",
      "1 of 3 taken so far",
      "",
      "✅ 8:30 AM Metformin 500 mg",
      "❌ 2:00 PM Amlodipine",
      "🕒 9:00 PM Atorvastatin 10 mg",
      "",
      "Open MedSaathi: https://medsaathi.example",
    ]);
  });

  it("builds a safely encoded wa.me link", () => {
    const link = whatsappLink("Baba's update & more\nline 2");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(link).not.toContain(" ");
    expect(link).not.toContain("\n");
    expect(decodeURIComponent(link.split("text=")[1] ?? "")).toBe("Baba's update & more\nline 2");
  });
});
