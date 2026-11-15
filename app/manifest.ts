import type { MetadataRoute } from "next";

/** Lets families add MedSaathi to the home screen so it opens full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MedSaathi",
    short_name: "MedSaathi",
    description: "Medicine reminders and care for elders, shared with the family. The family helps, the elder decides.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3fbff",
    theme_color: "#1e6b62",
    lang: "en-IN",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
