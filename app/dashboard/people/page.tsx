import { PageFrame } from "@/components/dashboard/PageFrame";
import { getAccounts, nowSec, recentSignIn, requireViewer, ROLE_LABEL } from "@/lib/dashboard/accounts";
import { InviteForm, PersonControls, ResetLinkForm, RevokeLink } from "../_components/forms";
import { Toolbar } from "../_components/Toolbar";
import { signOut } from "../actions";

export const metadata = { title: { absolute: "People · eternal Performance" } };

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/**
 * Owners only: who can open the dashboard, the links still waiting to be
 * used, and the last account changes. Invites are links the owner sends by
 * hand; no email address is asked for or kept.
 */
export default async function PeoplePage() {
  const viewer = await requireViewer(["owner"]);
  const doc = await getAccounts();
  const users = [...(doc?.users ?? [])].sort((a, b) => ["owner", "team", "client"].indexOf(a.role) - ["owner", "team", "client"].indexOf(b.role) || a.name.localeCompare(b.name));
  const links = (doc?.links ?? []).filter((l) => l.expiresAt > nowSec());
  const nameOf = (id?: string) => users.find((u) => u.id === id)?.name ?? "someone";
  const fresh = recentSignIn(viewer);

  return (
    <PageFrame title="People" viewer={viewer} toolbar={<Toolbar viewer={viewer} />} back>
      {!fresh && (
        <div className="dash-error" role="alert">
          You signed in more than 12 hours ago. For safety, sign out and in again before changing anyone&rsquo;s access.{" "}
          <form action={signOut} className="dash-inline">
            <button type="submit" className="dash-link as-button">
              Sign out now
            </button>
          </form>
        </div>
      )}

      <section className="dash-form" aria-labelledby="ppl-invite">
        <h2 id="ppl-invite">Invite someone</h2>
        <p className="dash-hint">
          You get a link that works once, for 7 days. Send it to the person privately (WhatsApp is fine). They choose their own username and password.
        </p>
        <InviteForm />
      </section>

      <section aria-labelledby="ppl-list">
        <h2 id="ppl-list">Who has access</h2>
        <div className="dash-tablebox">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Changes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === viewer.id ? " (you)" : ""}
                    <span className="dash-hint block">
                      {u.username} · joined {when(u.createdAt)}
                      {u.disabled ? " · paused" : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`dash-pill ${u.disabled ? "paused" : u.role}`}>{u.disabled ? "Paused" : ROLE_LABEL[u.role]}</span>
                  </td>
                  <td>
                    <PersonControls id={u.id} name={u.name} role={u.role} disabled={u.disabled} self={u.id === viewer.id} />
                    <ResetLinkForm userId={u.id} name={u.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ppl-links">
        <h2 id="ppl-links">Links waiting to be used</h2>
        {links.length ? (
          <div className="dash-tablebox">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">For</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Works until</th>
                  <th scope="col">
                    <span className="sr-only">Revoke</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id}>
                    <td>{l.kind === "invite" ? l.name : nameOf(l.userId)}</td>
                    <td>{l.kind === "invite" ? `Invite (${ROLE_LABEL[l.role ?? "client"]})` : "Password reset"}</td>
                    <td>{when(new Date(l.expiresAt * 1000).toISOString())} Cairo</td>
                    <td>
                      <RevokeLink id={l.id} label={`${l.kind} link for ${l.kind === "invite" ? l.name : nameOf(l.userId)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dash-hint">None. Links disappear once used or expired; the link itself is shown only when it is made.</p>
        )}
      </section>

      <section aria-labelledby="ppl-log">
        <h2 id="ppl-log">Recent changes</h2>
        {doc?.events.length ? (
          <ul className="dash-log">
            {[...doc.events]
              .reverse()
              .slice(0, 25)
              .map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  <span className="dash-hint">{when(e.at)}</span> {e.actor} {e.action}
                  {e.target ? ` · ${e.target}` : ""}
                </li>
              ))}
          </ul>
        ) : (
          <p className="dash-hint">Nothing yet.</p>
        )}
      </section>
    </PageFrame>
  );
}
