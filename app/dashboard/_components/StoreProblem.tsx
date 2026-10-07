import { AuthFrame } from "@/components/dashboard/AuthFrame";

/** When accounts cannot be read at all: say so plainly, with the fix for the owner. */
export function StoreProblem({ state }: { state: "no-store" | "unreachable" }) {
  return state === "no-store" ? (
    <AuthFrame title="Not connected yet" lede="This copy of the dashboard has no account store.">
      <p className="dash-hint">
        For the owner: in Vercel, open the eternal-storefront project, then Storage, and connect the private Blob store named eternal-dashboard to Production. Then
        redeploy.
      </p>
    </AuthFrame>
  ) : (
    <AuthFrame title="One moment" lede="The dashboard can't reach its accounts just now.">
      <p className="dash-hint">Reload the page in a minute. If it keeps happening, tell Seif.</p>
    </AuthFrame>
  );
}
