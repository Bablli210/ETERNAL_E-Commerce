import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/** Lets a phone save the shop to its home screen with the house's name, colours and mark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe7",
    theme_color: "#f3efe7",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
