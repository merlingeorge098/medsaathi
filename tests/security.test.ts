import { afterEach, describe, expect, it, vi } from "vitest";

// These modules are server-only; stub the Next.js and storage pieces they import.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: vi.fn(), newId: () => "test-id" }));

const { signToken, verifyToken } = await import("@/lib/session");
const { emailLayout, appUrl } = await import("@/lib/email");

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signed tokens (sessions and one-tap email links)", () => {
  it("round-trips the payload", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-one");
    const token = await signToken({ profileId: "p1", dose: "d1", action: "taken" }, "12h");
    const payload = await verifyToken<{ profileId: string; action: string }>(token);
    expect(payload?.profileId).toBe("p1");
    expect(payload?.action).toBe("taken");
  });

  it("rejects a tampered token", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-one");
    const token = await signToken({ action: "taken" }, "12h");
    const [header, , signature] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ action: "skip" })).toString("base64url");
    expect(await verifyToken(`${header}.${forgedBody}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-one");
    const token = await signToken({ action: "taken" }, "12h");
    vi.stubEnv("SESSION_SECRET", "attacker-secret");
    expect(await verifyToken(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-one");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T08:00:00Z"));
    const token = await signToken({ action: "taken" }, "12h");
    vi.setSystemTime(new Date("2026-01-01T21:00:00Z"));
    expect(await verifyToken(token)).toBeNull();
  });

  it("rejects garbage input without throwing", async () => {
    expect(await verifyToken("not-a-token")).toBeNull();
    expect(await verifyToken("")).toBeNull();
  });

  it("refuses to run in production without a secret", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_SECRET", "");
    delete process.env.SESSION_SECRET;
    await expect(signToken({ a: 1 }, "1h")).rejects.toThrow(/SESSION_SECRET/);
  });
});

describe("reminder email template", () => {
  it("escapes HTML in every text field", () => {
    const html = emailLayout({
      heading: "<script>alert(1)</script>",
      lines: ["Baba's <b>dose</b>"],
      card: { title: "<img src=x onerror=alert(1)>", detail: "a & b" },
      buttons: [{ label: "<i>Mark</i>", href: "https://example.com/a" }],
      footer: "\"quoted\"",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<i>Mark");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Baba&#39;s &lt;b&gt;dose&lt;/b&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).toContain("&quot;quoted&quot;");
  });

  it("escapes button links so they cannot break out of the href", () => {
    const html = emailLayout({ heading: "h", lines: [], buttons: [{ label: "Go", href: 'https://x.test/" onclick="alert(1)' }], footer: "f" });
    expect(html).not.toContain('" onclick="');
    expect(html).toContain("&quot; onclick=&quot;");
  });
});

describe("app URL used inside emails", () => {
  it("uses APP_URL and strips a trailing slash", () => {
    vi.stubEnv("APP_URL", "https://medsaathi.example/");
    expect(appUrl()).toBe("https://medsaathi.example");
  });

  it("falls back to the Vercel URL, then localhost", () => {
    vi.stubEnv("APP_URL", "");
    delete process.env.APP_URL;
    vi.stubEnv("VERCEL_URL", "medsaathi-abc.vercel.app");
    expect(appUrl()).toBe("https://medsaathi-abc.vercel.app");
    delete process.env.VERCEL_URL;
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
