import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { currentViewer } from "@/lib/dashboard/accounts";
import { getDashData, viewFor } from "@/lib/dashboard/build";
import { PERIOD_KEYS, type PeriodKey } from "@/lib/dashboard/types";
import { accessState, setupOpen } from "./_components/access";
import { StoreProblem } from "./_components/StoreProblem";
import { Toolbar } from "./_components/Toolbar";

/**
 * The figures, for signed-in people only. Each role gets its own view built
 * on the server (lib/dashboard/build.ts viewFor), so nothing a role may not
 * see is ever sent to its browser. ?days=7|30|90 picks the period.
 */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const access = await accessState();
  if (access.state === "no-store" || access.state === "unreachable") return <StoreProblem state={access.state} />;
  if (access.state === "setup") redirect(setupOpen() ? "/dashboard/setup" : "/dashboard/sign-in");
  const viewer = await currentViewer();
  if (!viewer) redirect("/dashboard/sign-in");

  const raw = (await searchParams).days;
  const days: PeriodKey = PERIOD_KEYS.find((k) => k === (Array.isArray(raw) ? raw[0] : raw)) ?? "30";
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  const data = viewFor(viewer.role, await getDashData(host));

  return <Dashboard data={data} days={days} viewer={viewer} toolbar={<Toolbar viewer={viewer} refresh />} />;
}
