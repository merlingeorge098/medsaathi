import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db, newId } from "./db";

/**
 * Sends email through Gmail SMTP when credentials are present. Every email is also written to the
 * profile's outbox so the circle (and judges) can see exactly what was sent and when.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transporter: Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export interface OutgoingEmail {
  profileId: string;
  to: string;
  subject: string;
  html: string;
  kind: string;
}

export async function sendEmail(mail: OutgoingEmail): Promise<boolean> {
  let delivered = false;
  // Demo circle addresses are placeholders: record them in the outbox but never hand them to SMTP.
  const isDemoAddress = mail.to.endsWith(".demo@medsaathi.app") || mail.to.endsWith("@medsaathi.app");
  if (emailConfigured() && mail.to && !isDemoAddress) {
    try {
      await getTransporter().sendMail({
        from: `MedSaathi <${process.env.GMAIL_USER}>`,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
      });
      delivered = true;
    } catch (error) {
      console.error("[email] delivery failed", error);
    }
  }
  const store = await db();
  await store.put("outbox", { id: newId("mail"), ...mail, delivered, at: new Date().toISOString() });
  return delivered;
}

export function appUrl(): string {
  return (process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

interface Button {
  label: string;
  href: string;
  primary?: boolean;
}

export function emailLayout(opts: { heading: string; lines: string[]; card?: { title: string; detail: string }; buttons?: Button[]; footer: string }): string {
  const buttons = (opts.buttons ?? [])
    .map(
      (b) =>
        `<a href="${escape(b.href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:14px 22px;border-radius:999px;font-weight:700;font-size:16px;text-decoration:none;${
          b.primary ? "background:#1e6b62;color:#ffffff;" : "background:#ffffff;color:#1e6b62;border:2px solid #1e6b62;"
        }">${escape(b.label)}</a>`,
    )
    .join("");
  const card = opts.card
    ? `<div style="border:1px solid #bec9c6;border-radius:14px;padding:18px;margin:18px 0;background:#f3fbff"><div style="font-size:20px;font-weight:700;color:#111d22">${escape(
        opts.card.title,
      )}</div><div style="font-size:15px;color:#3f4947;margin-top:4px">${escape(opts.card.detail)}</div></div>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#e9f6fc;font-family:Arial,Helvetica,sans-serif;color:#111d22">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="font-size:14px;font-weight:700;letter-spacing:.08em;color:#00524a;text-transform:uppercase">MedSaathi</div>
<div style="background:#ffffff;border-radius:16px;padding:28px;margin-top:12px">
<h1 style="font-size:24px;line-height:1.3;margin:0 0 12px">${escape(opts.heading)}</h1>
${opts.lines.map((l) => `<p style="font-size:16px;line-height:1.6;margin:0 0 8px;color:#3f4947">${escape(l)}</p>`).join("")}
${card}${buttons}
</div>
<p style="font-size:13px;color:#6f7977;line-height:1.5;margin-top:16px">${escape(opts.footer)}</p>
</div></body></html>`;
}
