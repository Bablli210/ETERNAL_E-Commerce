import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  // /launch-checklist is left out on purpose: a Disallow would advertise it, and would stop crawlers reading the page's own noindex.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml` };
}
