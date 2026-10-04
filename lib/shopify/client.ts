import "server-only";

export const storeDomain = process.env.SHOPIFY_STORE_DOMAIN ?? "eternal-10199.myshopify.com";

/**
 * The branded host Shopify serves the store and checkout on, such as
 * checkout.example.com (host name only, no https://). Set
 * SHOPIFY_CHECKOUT_DOMAIN once that host is the store's primary domain
 * (playbook 4.6 and 7.2): checkout links, the checkout preconnect and the
 * newsletter form then stay on the brand's domain, so the visitor sees one
 * domain and the ad-click cookies reach checkout. Posting to the
 * myshopify.com host after that would be redirected, which turns a form POST
 * into a GET and drops it. Unset, it falls back to storeDomain.
 */
export const checkoutDomain = process.env.SHOPIFY_CHECKOUT_DOMAIN || storeDomain;

const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2026-07";

/** True when a Storefront API token is configured; otherwise the site runs on the snapshot. */
export const shopifyConfigured = Boolean(token && token.length > 0);

export class StorefrontError extends Error {
  constructor(message: string, public readonly errors?: unknown) {
    super(message);
  }
}

/** A GraphQL document whose operation is a mutation (cartCreate and the like). */
const MUTATION = /^\s*mutation\b/m;

/**
 * Every Storefront call is an HTTP POST, and Next caches a POST that carries
 * next.revalidate, keyed on its body. That is right for product queries
 * (cached, tagged "products") and never right for a mutation: a cached
 * cartCreate hands the next shopper with the same bag the same cart. So a
 * mutation, or revalidate 0, always goes out with cache: "no-store".
 */
export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { revalidate = 300, tags }: { revalidate?: number | false; tags?: string[] } = {},
): Promise<T> {
  if (!token) throw new StorefrontError("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");
  const fresh = revalidate === 0 || MUTATION.test(query);
  const res = await fetch(`https://${storeDomain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate, tags } }),
  });
  if (!res.ok) throw new StorefrontError(`Storefront API ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new StorefrontError("Storefront API returned errors", json.errors);
  if (!json.data) throw new StorefrontError("Storefront API returned no data");
  return json.data;
}
