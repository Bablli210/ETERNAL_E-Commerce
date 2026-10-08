import { PageFrame } from "@/components/dashboard/PageFrame";
import { requireViewer, ROLE_LABEL } from "@/lib/dashboard/accounts";
import { accessState } from "../_components/access";
import { PasswordForm, SignOutEverywhereForm } from "../_components/forms";
import { StoreProblem } from "../_components/StoreProblem";
import { Toolbar } from "../_components/Toolbar";

export const metadata = { title: { absolute: "Your account · eternal Performance" } };

export default async function AccountPage() {
  const access = await accessState();
  if (access.state === "no-store" || access.state === "unreachable") return <StoreProblem state={access.state} />;
  const viewer = await requireViewer();
  return (
    <PageFrame title="Your account" viewer={viewer} toolbar={<Toolbar viewer={viewer} />} back>
      <section className="dash-form" aria-labelledby="acc-who">
        <h2 id="acc-who">Signed in as {viewer.name}</h2>
        <p className="dash-hint">
          Username {viewer.username} · {ROLE_LABEL[viewer.role]}
          {viewer.role === "client" ? " (you can see the figures; owners manage access)" : ""}
        </p>
      </section>
      <section className="dash-form" aria-labelledby="acc-pw">
        <h2 id="acc-pw">Change your password</h2>
        <PasswordForm />
      </section>
      <section className="dash-form" aria-labelledby="acc-out">
        <h2 id="acc-out">Signed in somewhere you shouldn&rsquo;t be?</h2>
        <p className="dash-hint">This signs you out on every phone and computer, including this one.</p>
        <SignOutEverywhereForm />
      </section>
    </PageFrame>
  );
}
