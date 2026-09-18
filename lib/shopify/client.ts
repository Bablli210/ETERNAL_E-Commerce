import "server-only";

export const storeDomain = process.env.SHOPIFY_STORE_DOMAIN ?? "eternal-10199.myshopify.com";
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2026-07";

/** True when a Storefront API token is configured; otherwise the site runs on the snapshot. */
export const shopifyConfigured = Boolean(token && token.length > 0);

export class StorefrontError extends Error {
  constructor(message: string, public readonly errors?: unknown) {
    super(message);
  }
}

export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { revalidate = 300, tags }: { revalidate?: number | false; tags?: string[] } = {},
): Promise<T> {
  if (!token) throw new StorefrontError("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");
  const res = await fetch(`https://${storeDomain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate, tags },
  });
  if (!res.ok) throw new StorefrontError(`Storefront API ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new StorefrontError("Storefront API returned errors", json.errors);
  if (!json.data) throw new StorefrontError("Storefront API returned no data");
  return json.data;
}
