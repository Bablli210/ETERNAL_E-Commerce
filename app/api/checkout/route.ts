import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkoutDomain, shopifyConfigured } from "@/lib/shopify/client";
import { createCheckout } from "@/lib/shopify/queries";
import { numericId } from "@/lib/format";

type Body = { lines: { variantId: string; quantity: number }[]; attributes?: { key: string; value: string }[] };

/** Campaign keys the storefront may attach to an order; anything else is dropped. */
const ATTRIBUTE_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "landing_page", "first_utm_source", "first_utm_campaign", "in_app", "quiz_profile"]);
/** Test arms travel as exp_{id}. */
const EXPERIMENT_KEY = /^exp_[a-z0-9_-]{1,32}$/i;
const VARIANT_ID = /^(gid:\/\/shopify\/ProductVariant\/)?\d+$/;
/** The free 5 ml picks, scent names joined by commas (CartProvider); shown on the order as "Free 5 ml samples". */
const SAMPLES = /^[\p{L}\p{N} .,'’&()-]{1,600}$/u;
/** A discount code from the ad link (?discount=CODE); Shopify validates it at checkout. */
const DISCOUNT_CODE = /^[A-Za-z0-9_-]{2,40}$/;
const MAX_QTY = 10;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Every Checkout tap makes its own cart; nothing on this route is ever cached. */
export const dynamic = "force-dynamic";

/**
 * The landing campaign proxy.ts keeps in the 30-day eternal_utm cookie, for
 * when the browser's own copy is gone (Safari's storage cap, cleared data).
 */
function utmFromCookie(value: string | undefined): { key: string; value: string }[] {
  if (!value) return [];
  try {
    const c = JSON.parse(value) as Record<string, unknown>;
    if (!c || typeof c !== "object") return [];
    const out: { key: string; value: string }[] = [];
    for (const k of UTM) if (typeof c[k] === "string" && c[k]) out.push({ key: k, value: (c[k] as string).slice(0, 200) });
    if (out.length && typeof c.landing === "string" && c.landing.startsWith("/")) out.push({ key: "landing_page", value: c.landing.slice(0, 200) });
    return out;
  } catch {
    return [];
  }
}

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
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const lines = (Array.isArray(body.lines) ? body.lines : [])
    .filter((l) => l && typeof l.variantId === "string" && VARIANT_ID.test(l.variantId) && Number.isFinite(l.quantity) && l.quantity >= 1)
    .map((l) => ({ variantId: l.variantId, quantity: Math.min(MAX_QTY, Math.floor(l.quantity)) }));
  if (!lines.length) return NextResponse.json({ error: "Your bag is empty" }, { status: 400 });
  const discount = (Array.isArray(body.attributes) ? body.attributes : []).find((a) => a?.key === "discount" && typeof a.value === "string" && DISCOUNT_CODE.test(a.value))?.value;
  const attributes = (Array.isArray(body.attributes) ? body.attributes : [])
    .filter((a) => a && (ATTRIBUTE_KEYS.has(a.key) || EXPERIMENT_KEY.test(a.key)) && typeof a.value === "string" && a.value)
    .map((a) => ({ key: a.key, value: a.value.slice(0, 200) }));
  // Visible to the team on the order, so each bottle ships with the 5 ml the buyer picked.
  const samples = (Array.isArray(body.attributes) ? body.attributes : []).find((a) => a?.key === "free_samples" && typeof a.value === "string" && SAMPLES.test(a.value))?.value;
  if (samples) attributes.push({ key: "Free 5 ml samples", value: samples });

  // The Meta and Google first-party cookies tie the order to the browser that clicked the ad. Shopify hides _-prefixed attributes from the buyer.
  const jar = await cookies();
  const fbp = jar.get("_fbp")?.value;
  const fbc = jar.get("_fbc")?.value;
  const ga = jar.get("_ga")?.value;
  if (fbp) attributes.push({ key: "_fbp", value: fbp.slice(0, 200) });
  if (fbc) attributes.push({ key: "_fbc", value: fbc.slice(0, 200) });
  if (ga) attributes.push({ key: "ga_cid", value: ga.split(".").slice(-2).join(".") });
  // No campaign from the browser: fall back to the server cookie, so the order still carries its ad (and its ref below).
  if (!attributes.some((a) => a.key.startsWith("utm_"))) {
    for (const a of utmFromCookie(jar.get("eternal_utm")?.value)) if (!attributes.some((b) => b.key === a.key)) attributes.push(a);
  }

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
  const permalink = `https://${checkoutDomain}/cart/${lines.map((l) => `${numericId(l.variantId)}:${l.quantity}`).join(",")}${qs ? `?${qs}` : ""}`;
  return NextResponse.json({ url: permalink, mode: "permalink" });
}
