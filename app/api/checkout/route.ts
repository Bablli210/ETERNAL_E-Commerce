import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { shopifyConfigured, storeDomain } from "@/lib/shopify/client";
import { createCheckout } from "@/lib/shopify/queries";
import { numericId } from "@/lib/format";

type Body = { lines: { variantId: string; quantity: number }[]; attributes?: { key: string; value: string }[] };

/** Campaign keys the storefront may attach to an order; anything else is dropped. */
const ATTRIBUTE_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "landing_page", "first_utm_source", "first_utm_campaign", "in_app", "quiz_profile"]);
/** Test arms travel as exp_{id}. */
const EXPERIMENT_KEY = /^exp_[a-z0-9_-]{1,32}$/i;
const VARIANT_ID = /^(gid:\/\/shopify\/ProductVariant\/)?\d+$/;
/** A discount code from the ad link (?discount=CODE); Shopify validates it at checkout. */
const DISCOUNT_CODE = /^[A-Za-z0-9_-]{2,40}$/;
const MAX_QTY = 10;

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
  const lines = (Array.isArray(body.lines) ? body.lines : [])
    .filter((l) => l && typeof l.variantId === "string" && VARIANT_ID.test(l.variantId) && Number.isFinite(l.quantity) && l.quantity >= 1)
    .map((l) => ({ variantId: l.variantId, quantity: Math.min(MAX_QTY, Math.floor(l.quantity)) }));
  if (!lines.length) return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
  const discount = (Array.isArray(body.attributes) ? body.attributes : []).find((a) => a?.key === "discount" && typeof a.value === "string" && DISCOUNT_CODE.test(a.value))?.value;
  const attributes = (Array.isArray(body.attributes) ? body.attributes : [])
    .filter((a) => a && (ATTRIBUTE_KEYS.has(a.key) || EXPERIMENT_KEY.test(a.key)) && typeof a.value === "string" && a.value)
    .map((a) => ({ key: a.key, value: a.value.slice(0, 200) }));

  // The Meta and Google first-party cookies tie the order to the browser that clicked the ad. Shopify hides _-prefixed attributes from the buyer.
  const jar = await cookies();
  const fbp = jar.get("_fbp")?.value;
  const fbc = jar.get("_fbc")?.value;
  const ga = jar.get("_ga")?.value;
  if (fbp) attributes.push({ key: "_fbp", value: fbp.slice(0, 200) });
  if (fbc) attributes.push({ key: "_fbc", value: fbc.slice(0, 200) });
  if (ga) attributes.push({ key: "ga_cid", value: ga.split(".").slice(-2).join(".") });

  if (shopifyConfigured) {
    try {
      const url = await createCheckout(lines.map((l) => ({ merchandiseId: l.variantId.startsWith("gid:") ? l.variantId : `gid://shopify/ProductVariant/${l.variantId}`, quantity: l.quantity })), attributes, discount ? [discount] : []);
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
  if (discount) query.set("discount", discount);
  const qs = query.toString();
  const permalink = `https://${storeDomain}/cart/${lines.map((l) => `${numericId(l.variantId)}:${l.quantity}`).join(",")}${qs ? `?${qs}` : ""}`;
  return NextResponse.json({ url: permalink, mode: "permalink" });
}
