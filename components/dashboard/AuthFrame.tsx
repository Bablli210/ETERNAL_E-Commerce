import { DashBrand } from "./TopBar";

/**
 * The frame for the pages before someone is signed in (sign-in, setup,
 * invite, password reset) and for the dashboard's not-found and store
 * problems: one card in the middle of the dashboard's ground, with the
 * logotype, the page's title, an optional line under it, then the form.
 */
export function AuthFrame({ title, lede, children }: { title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <main className="dash-auth" id="dash-main">
      <div className="dash-auth-card">
        <DashBrand link={false} />
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
        {children}
      </div>
    </main>
  );
}
