import { NextResponse } from "next/server";
import { shopifyConfigured, storeDomain } from "@/lib/shopify/client";
import { createCheckout } from "@/lib/shopify/queries";
import { numericId } from "@/lib/format";

type Body = { lines: { variantId: string; quantity: number }[] };

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

  if (shopifyConfigured) {
    try {
      const url = await createCheckout(lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })));
      return NextResponse.json({ url, mode: "storefront" });
    } catch (err) {
      console.error("[checkout] Storefront cart failed, falling back to permalink:", err);
    }
  }
  const permalink = `https://${storeDomain}/cart/${lines.map((l) => `${numericId(l.variantId)}:${l.quantity}`).join(",")}`;
  return NextResponse.json({ url: permalink, mode: "permalink" });
}
