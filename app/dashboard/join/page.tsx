import { AuthFrame } from "@/components/dashboard/AuthFrame";
import { JoinForm } from "../_components/forms";
import { accessState } from "../_components/access";
import { StoreProblem } from "../_components/StoreProblem";

export const metadata = { title: { absolute: "Join · eternal Performance" } };

/** Opened from an invite link (/dashboard/join#<token>). Nothing happens until the form is sent, so link previews cannot use the invite up. */
export default async function JoinPage() {
  const access = await accessState();
  if (access.state === "no-store" || access.state === "unreachable") return <StoreProblem state={access.state} />;
  return (
    <AuthFrame title="Join the eternal dashboard" lede="Choose a username and password. You will use them to sign in from now on.">
      <JoinForm />
      <p className="dash-hint">This invite works once. If it says it has expired, ask the person who sent it for a new one.</p>
    </AuthFrame>
  );
}
