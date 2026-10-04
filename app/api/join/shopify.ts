/**
 * The newsletter signup on Shopify's customer form, posted from the server so
 * its answer can be read (a browser post to another origin is opaque).
 *
 * Shopify answers a signup it accepted with a redirect back into the shop
 * (to ?customer_posted=true). It sends a bot check to /challenge and a locked
 * store to /password, and a 301 from the myshopify.com host to the primary
 * domain turns the POST into a GET and drops it. Only a 2xx, or a 302/303 to
 * somewhere other than /challenge or /password, counts as joined.
 */
export type JoinResult = { ok: true } | { ok: false; reason: string };

const BLOCKED = /^\/(challenge|password)(\/|$)/;

export function joinOutcome(status: number, location: string | null, domain: string): JoinResult {
  if (status >= 200 && status < 300) return { ok: true };
  if (status === 302 || status === 303) {
    if (!location) return { ok: false, reason: "redirect_without_location" };
    let path: string;
    try {
      path = new URL(location, `https://${domain}`).pathname;
    } catch {
      return { ok: false, reason: "redirect_unreadable" };
    }
    return BLOCKED.test(path) ? { ok: false, reason: path.split("/")[1] } : { ok: true };
  }
  return { ok: false, reason: `http_${status}` };
}

export const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

export async function joinNewsletter(domain: string, email: string, { userAgent, fetcher = fetch }: { userAgent?: string | null; fetcher?: typeof fetch } = {}): Promise<JoinResult> {
  const body = new URLSearchParams({ form_type: "customer", utf8: "✓", "contact[email]": email, "contact[tags]": "newsletter" });
  try {
    const res = await fetcher(`https://${domain}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html", ...(userAgent ? { "User-Agent": userAgent.slice(0, 300) } : {}) },
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return joinOutcome(res.status, res.headers.get("location"), domain);
  } catch {
    return { ok: false, reason: "network" };
  }
}
