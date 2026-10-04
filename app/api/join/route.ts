import { NextResponse } from "next/server";
import { checkoutDomain } from "@/lib/shopify/client";
import { EMAIL, joinNewsletter } from "./shopify";

/**
 * The footer's newsletter join. Posts the email to Shopify's customer form
 * (tagged newsletter) and answers { ok } from what Shopify actually said, so
 * the page only thanks the visitor, and only reports a Lead, when the signup
 * went through. The form lives on the store's primary domain (checkoutDomain),
 * where a POST is not redirected away.
 */
export async function POST(req: Request) {
  let email: unknown;
  try {
    email = ((await req.json()) as { email?: unknown } | null)?.email;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });

  const result = await joinNewsletter(checkoutDomain, email.trim(), { userAgent: req.headers.get("user-agent") });
  if (!result.ok) console.error("[join] Shopify did not take the signup:", result.reason);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
