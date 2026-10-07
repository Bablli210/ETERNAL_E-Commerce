import { AuthFrame } from "@/components/dashboard/AuthFrame";
import { ResetForm } from "../_components/forms";
import { accessState } from "../_components/access";
import { StoreProblem } from "../_components/StoreProblem";

export const metadata = { title: { absolute: "New password · eternal Performance" } };

/** Opened from a reset link an owner made (/dashboard/reset#<token>). Setting the password signs out every other device. */
export default async function ResetPage() {
  const access = await accessState();
  if (access.state === "no-store" || access.state === "unreachable") return <StoreProblem state={access.state} />;
  return (
    <AuthFrame title="Set a new password" lede="This link works once and for 24 hours. Afterwards you sign in with your username and the new password.">
      <ResetForm />
    </AuthFrame>
  );
}
