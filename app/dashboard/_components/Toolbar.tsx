import Link from "next/link";
import { signOut } from "../actions";
import { RefreshButton } from "./forms";
import type { Viewer } from "@/lib/dashboard/types";

/** The signed-in person's controls in the dashboard's top bar. */
export function Toolbar({ viewer, refresh = false }: { viewer: Viewer; refresh?: boolean }) {
  return (
    <div className="dash-toolbar">
      {refresh && viewer.role !== "client" && <RefreshButton />}
      {viewer.role === "owner" && (
        <Link className="dash-link" href="/dashboard/people">
          People
        </Link>
      )}
      <Link className="dash-link" href="/dashboard/account">
        {viewer.name}
      </Link>
      <form action={signOut}>
        <button type="submit" className="dash-link as-button">
          Sign out
        </button>
      </form>
    </div>
  );
}
