import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { consentFromCookieHeader } from "@/lib/consent";

/**
 * TikTok Events API: the server copy of a browser pixel event. The browser
 * sends the same event id it gave the pixel, so TikTok keeps one of the pair.
 * Off unless NEXT_PUBLIC_TIKTOK_PIXEL_ID and TIKTOK_EVENTS_TOKEN are both set,
 * and the visitor has said yes to marketing cookies.
 * InitiateCheckout and CompletePayment are not sent from here; Shopify's TikTok channel owns them.
 */
const PIXEL = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const TOKEN = process.env.TIKTOK_EVENTS_TOKEN;
/** Set only while checking the setup: the events then also show in Events Manager > Test events. */
const TEST_CODE = process.env.TIKTOK_TEST_EVENT_CODE || undefined;
const ALLOWED = new Set(["ViewContent", "AddToCart"]);
const MAX_QTY = 10;
const MAX_ITEMS = 20;
/** TikTok's click id: letters, digits, and the few separators it uses. */
const TTCLID = /^[A-Za-z0-9._-]{8,500}$/;

type Body = { event?: unknown; event_id?: unknown; url?: unknown; ttclid?: unknown; properties?: unknown };
type Content = { content_id: string; content_type: "product"; content_name?: string; quantity: number; price: number };

const cookie = (header: string | null, name: string) => header?.split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? undefined;

const hostOf = (url: unknown) => {
  if (typeof url !== "string") return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 100;

/** This storefront's own host: the one the request came to, or the configured site URL's. */
const ownHost = (req: Request, host: string | null) => host !== null && (host === req.headers.get("host") || host === hostOf(site.url));

/** Only the storefront's own pages may relay events (as app/api/meta). */
function sameOrigin(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  return ownHost(req, hostOf(req.headers.get("origin")));
}

/**
 * The product data TikTok needs, rebuilt from an allowlist; value is
 * recomputed from the contents, so a forged call cannot report any value it likes.
 */
function cleanProperties(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const contents: Content[] = (Array.isArray(d.contents) ? d.contents : []).slice(0, MAX_ITEMS).flatMap((c: unknown) => {
    if (!c || typeof c !== "object") return [];
    const { content_id, content_name, quantity, price } = c as Record<string, unknown>;
    if (!isId(content_id) || typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000) return [];
    const q = typeof quantity === "number" && Number.isFinite(quantity) ? Math.min(MAX_QTY, Math.max(1, Math.floor(quantity))) : 1;
    return [{ content_id, content_type: "product" as const, ...(typeof content_name === "string" && content_name ? { content_name: content_name.slice(0, 100) } : {}), quantity: q, price }];
  });
  if (!contents.length) return null;
  return {
    contents,
    content_type: "product",
    value: Math.round(contents.reduce((n, c) => n + c.price * c.quantity, 0) * 100) / 100,
    currency: "EGP",
  };
}

export async function POST(req: Request) {
  if (!PIXEL || !TOKEN) return new NextResponse(null, { status: 204 });
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  // Only for a visitor who said yes to marketing (lib/consent.ts); the browser checks too, this is the server's own check.
  if (!consentFromCookieHeader(req.headers.get("cookie"))?.marketing) return new NextResponse(null, { status: 204 });
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof body.event !== "string" || !ALLOWED.has(body.event) || !isId(body.event_id)) return new NextResponse(null, { status: 400 });
  const properties = cleanProperties(body.properties);
  if (!properties) return new NextResponse(null, { status: 400 });
  const url = typeof body.url === "string" && ownHost(req, hostOf(body.url)) ? body.url.slice(0, 1000) : undefined;
  const ttclid = typeof body.ttclid === "string" && TTCLID.test(body.ttclid) ? body.ttclid : undefined;

  const cookies = req.headers.get("cookie");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const event = {
    event: body.event,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id,
    user: {
      ttclid,
      ttp: cookie(cookies, "_ttp"),
      ip,
      user_agent: req.headers.get("user-agent") ?? undefined,
    },
    page: url ? { url } : undefined,
    properties,
  };

  try {
    // The token travels in a header, never in a URL that logs and proxies could keep.
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": TOKEN },
      body: JSON.stringify({ event_source: "web", event_source_id: PIXEL, data: [event], ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}) }),
      cache: "no-store",
    });
    // TikTok answers 200 with its own code; anything but 0 is a rejection.
    const answer = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (!res.ok || answer?.code !== 0) console.error("[tiktok] Events API rejected the event:", res.status, answer?.code, answer?.message);
  } catch (err) {
    console.error("[tiktok] Events API unreachable:", err);
  }
  return new NextResponse(null, { status: 204 });
}
