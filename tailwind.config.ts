import type { Config } from "tailwindcss";

/** Design tokens exported from the Stitch "Warm Editorial Care" design system. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f3fbff",
        "surface-low": "#e9f6fc",
        "surface-mid": "#e3f0f7",
        "surface-high": "#ddeaf1",
        card: "#ffffff",
        ink: "#111d22",
        muted: "#3f4947",
        outline: "#6f7977",
        line: "#bec9c6",
        primary: { DEFAULT: "#00524a", soft: "#1e6b62", tint: "#a8f0e4", on: "#ffffff" },
        clay: { DEFAULT: "#97471f", soft: "#ffdbcd", strong: "#c46a3f" },
        taken: { DEFAULT: "#2f7d4f", soft: "#e3f3e8" },
        due: { DEFAULT: "#8a5a12", soft: "#fdf1dc" },
        missed: { DEFAULT: "#b23a3a", soft: "#fdeaea" },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible Next"', '"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "elder-body": ["1.25rem", { lineHeight: "1.9rem" }],
        "elder-title": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "elder-display": ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
      },
      borderRadius: { card: "14px" },
      minHeight: { elder: "64px" },
    },
  },
  plugins: [],
};

export default config;
