import type { Metadata, Viewport } from "next";
import "./dashboard.css";

/**
 * The team and client dashboard: its own frame (no shop header, footer, bag,
 * cookie banner or tracking; components/chrome/ShopChrome.tsx), never cached
 * (every page reads the signed-in person) and never indexed.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "eternal · Performance" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "same-origin",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#17110c" }, { color: "#f1ede4" }] };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="dash">{children}</div>;
}
