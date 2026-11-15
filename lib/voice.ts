import type { FoodTiming } from "./types";

/** What the elder hears when they tap "Read aloud". Pure, so it can be tested and reused. */
export interface DoseSpeechInput {
  elderName: string;
  medicine: string;
  strength?: string;
  tablets: number;
  food: FoodTiming;
}

/** Spoken when nothing is due: the next dose, or a well-done when the day is complete. */
export function nextDoseSpeech(
  elderName: string,
  next?: { medicine: string; strength?: string; time: string },
): { en: string; hi: string } {
  if (!next) {
    return {
      en: `${elderName} ji, all your medicines for today are done. Well done!`,
      hi: `${elderName} जी, आज की सारी दवाइयाँ हो गई हैं। शाबाश!`,
    };
  }
  const med = [next.medicine, next.strength].filter(Boolean).join(" ");
  return {
    en: `${elderName} ji, there is nothing to take right now. Your next medicine is ${med}, at ${next.time}.`,
    hi: `${elderName} जी, अभी कोई दवा नहीं लेनी है। अगली दवा ${med} है, ${next.time} पर।`,
  };
}

export function doseSpeech({ elderName, medicine, strength, tablets, food }: DoseSpeechInput): {
  en: string;
  hi: string;
} {
  const med = [medicine, strength].filter(Boolean).join(" ");
  const count = Math.max(1, Math.round(tablets));
  const enFood = food === "after" ? " after your meal" : food === "before" ? " before your meal" : "";
  const hiFood = food === "after" ? " खाना खाने के बाद लीजिए।" : food === "before" ? " खाना खाने से पहले लीजिए।" : "";
  return {
    en: `${elderName} ji, it is time for your medicine. Please take ${count} ${count === 1 ? "tablet" : "tablets"} of ${med}${enFood}, with a full glass of water.`,
    hi: `${elderName} जी, दवा का समय हो गया है। ${med} की ${count} गोली${hiFood} साथ में एक गिलास पानी पीजिए।`,
  };
}
