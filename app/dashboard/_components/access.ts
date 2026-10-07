import "server-only";
import { getAccounts } from "@/lib/dashboard/accounts";
import { storeReady } from "@/lib/dashboard/store";

/**
 * Where the dashboard stands before anyone signs in: no store connected, the
 * store out of reach, no owner yet (setup), or ready.
 */
export type Access = { state: "no-store" | "unreachable" | "setup" | "ready" };

export async function accessState(): Promise<Access> {
  if (!storeReady()) return { state: "no-store" };
  try {
    const doc = await getAccounts();
    return { state: doc?.users.some((u) => u.role === "owner") ? "ready" : "setup" };
  } catch (err) {
    console.error("[dashboard] account store:", err instanceof Error ? err.message : err);
    return { state: "unreachable" };
  }
}

/** Whether the one-time setup page is open: only while DASHBOARD_SETUP_CODE is set. */
export const setupOpen = () => (process.env.DASHBOARD_SETUP_CODE?.trim().length ?? 0) >= 24;
