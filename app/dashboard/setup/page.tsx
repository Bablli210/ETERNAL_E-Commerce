import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthFrame } from "@/components/dashboard/AuthFrame";
import { SetupForm } from "../_components/forms";
import { accessState, setupOpen } from "../_components/access";
import { StoreProblem } from "../_components/StoreProblem";

export const metadata = { title: { absolute: "Set up · eternal Performance" } };

/**
 * The first owner account, with the one-time DASHBOARD_SETUP_CODE. The page
 * exists only while that variable is set; the code works once. With a new
 * code it also recovers an owner who is locked out.
 */
export default async function SetupPage() {
  if (!setupOpen()) notFound();
  const access = await accessState();
  if (access.state === "no-store" || access.state === "unreachable") return <StoreProblem state={access.state} />;
  return (
    <AuthFrame
      title={access.state === "setup" ? "Set up the dashboard" : "Owner recovery"}
      lede={
        access.state === "setup"
          ? "Create the first owner account. Owners invite the team and clients afterwards."
          : "With a new setup code, an owner who is locked out can set a new password here."
      }
    >
      <SetupForm />
      {access.state === "ready" && (
        <p className="dash-hint">
          Already have an account? <Link href="/dashboard/sign-in">Sign in</Link>.
        </p>
      )}
    </AuthFrame>
  );
}

