import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

/**
 * Gemini powers two features:
 *  1. Reading a photo of a handwritten or printed prescription into structured medicines.
 *  2. Writing a short, plain-language summary for the next doctor visit.
 */
export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

const model = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const scannedMedicine = z.object({
  name: z.string(),
  strength: z.string().default(""),
  pattern: z.string(),
  food: z.enum(["before", "after", "any"]).default("after"),
  durationDays: z.number().int().nullable().optional(),
  purpose: z.string().optional(),
});
export type ScannedMedicine = z.infer<typeof scannedMedicine>;

export async function readPrescription(base64: string, mimeType: string): Promise<ScannedMedicine[]> {
  const response = await client().models.generateContent({
    model: model(),
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          {
            text:
              "This is an Indian doctor's prescription. List every medicine. For each, give the brand or generic name, the strength (e.g. 500 mg), " +
              "the dosing pattern in Indian shorthand morning-afternoon-night such as 1-0-1 (use 4 parts only if an evening dose is written), " +
              "whether it is taken before or after food, the duration in days if written, and a 2-4 word purpose if obvious. " +
              "If something is unreadable, make your best guess and keep the pattern valid. Do not invent medicines that are not on the page.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            strength: { type: Type.STRING },
            pattern: { type: Type.STRING },
            food: { type: Type.STRING, enum: ["before", "after", "any"] },
            durationDays: { type: Type.INTEGER, nullable: true },
            purpose: { type: Type.STRING },
          },
          required: ["name", "pattern", "food"],
        },
      },
    },
  });
  const parsed = z.array(scannedMedicine).safeParse(JSON.parse(response.text ?? "[]"));
  return parsed.success ? parsed.data : [];
}

export async function doctorSummary(facts: string): Promise<string> {
  const response = await client().models.generateContent({
    model: model(),
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Write a short summary (max 120 words) that a family member can show a doctor at the next visit. " +
              "Plain English, no diagnosis, no advice, no markdown symbols, no headings. Mention adherence, which doses get missed and the reasons the elder gave. " +
              "End with one line listing the questions the family wants to ask.\n\nFacts:\n" +
              facts,
          },
        ],
      },
    ],
  });
  return (response.text ?? "").trim();
}
