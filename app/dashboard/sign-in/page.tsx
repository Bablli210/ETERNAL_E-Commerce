import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/dashboard/AuthFrame";
import { currentViewer } from "@/lib/dashboard/accounts";
import { SignInForm } from "../_components/forms";
import { accessState, setupOpen } from "../_components/access";
import { StoreProblem } from "../_components/StoreProblem";

export const metadata = { title: { absolute: "Sign in · eternal Performance" } };

export default async function SignInPage() {
  const access = await accessState();
  if (access.state === "setup" && setupOpen()) redirect("/dashboard/setup");
  if (access.state !== "ready" && access.state !== "setup") return <StoreProblem state={access.state} />;
  if (access.state === "ready" && (await currentViewer().catch(() => null))) redirect("/dashboard");
  return (
    <AuthFrame title="Sign in" lede="The eternal team's figures: sales, advertising and the tracking behind them.">
      {access.state === "setup" ? (
        <p className="dash-hint">The dashboard has not been set up yet. Ask Seif for the setup link.</p>
      ) : (
        <>
          <SignInForm />
          <p className="dash-hint">Forgot your password? Ask an owner for a reset link.</p>
        </>
      )}
    </AuthFrame>
  );
}
