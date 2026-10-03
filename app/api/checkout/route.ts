import { NextResponse } from "next/server";
import { shopifyConfigured, storeDomain } from "@/lib/shopify/client";
import { createCheckout } from "@/lib/shopify/queries";
import { numericId } from "@/lib/format";

type Body = { lines: { variantId: string; quantity: number }[]; attributes?: { key: string; value: string }[] };

/** Campaign keys the storefront may attach to an order; anything else is dropped. */
const ATTRIBUTE_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "landing_page", "first_utm_source", "first_utm_campaign"]);

/**
 * Turns the local bag into a Shopify checkout. With a Storefront token this
 * creates a cart and returns its checkoutUrl; without one it returns a
 * Shopify cart permalink, which needs no credentials and lands on the same
 * checkout.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const lines = (body.lines ?? []).filter((l) => l.variantId && l.quantity > 0);
  if (!lines.length) return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
  const attributes = (Array.isArray(body.attributes) ? body.attributes : [])
    .filter((a) => a && ATTRIBUTE_KEYS.has(a.key) && typeof a.value === "string" && a.value)
    .map((a) => ({ key: a.key, value: a.value.slice(0, 200) }));

  if (shopifyConfigured) {
    try {
      const url = await createCheckout(lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })), attributes);
      return NextResponse.json({ url, mode: "storefront" });
    } catch (err) {
      console.error("[checkout] Storefront cart failed, falling back to permalink:", err);
    }
  }
  // Permalinks carry the campaign as order attributes, and the source as the order's referral code.
  const query = new URLSearchParams();
  for (const a of attributes) query.append(`attributes[${a.key}]`, a.value);
  const source = attributes.find((a) => a.key === "utm_source")?.value;
  if (source) query.set("ref", source);
  const qs = query.toString();
  const permalink = `https://${storeDomain}/cart/${lines.map((l) => `${numericId(l.variantId)}:${l.quantity}`).join(",")}${qs ? `?${qs}` : ""}`;
  return NextResponse.json({ url: permalink, mode: "permalink" });
}
