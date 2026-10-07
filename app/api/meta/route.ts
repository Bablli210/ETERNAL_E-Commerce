import { NextResponse } from "next/server";
import { site } from "@/content/site";

/**
 * Meta Conversions API: the server copy of a browser pixel event. The browser
 * sends the same event id it gave the pixel, so Meta keeps one of the pair.
 * Off unless NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_TOKEN are both set.
 * Purchase is not sent from here; Shopify's Facebook & Instagram channel owns it.
 */
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const VERSION = process.env.META_GRAPH_VERSION || "v23.0";
/**
 * Set only while checking the setup: the events then also show in Events Manager > Test events. Meta still counts
 * them like any other event, so it never keeps test traffic out; leave META_CAPI_TOKEN unset on Preview for that.
 */
const TEST_CODE = process.env.META_TEST_EVENT_CODE || undefined;
const ALLOWED = new Set(["ViewContent", "AddToCart"]);
const MAX_QTY = 10;
const MAX_ITEMS = 20;

type Body = { event_name?: unknown; event_id?: unknown; event_source_url?: unknown; custom_data?: unknown };
type Content = { id: string; quantity: number; item_price: number };

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

/**
 * Only the storefront's own pages may relay events. A same-origin beacon
 * carries Sec-Fetch-Site: same-origin; older WebKit sends no Sec-Fetch-*
 * headers but still sends Origin on a POST.
 */
function sameOrigin(req: Request) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  return ownHost(req, hostOf(req.headers.get("origin")));
}

/**
 * The product data Meta needs, rebuilt from an allowlist. Anything else the
 * caller sends is dropped and value is recomputed from the contents, so a
 * forged call cannot report an AddToCart of any value it likes.
 */
function cleanCustomData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const contents: Content[] = (Array.isArray(d.contents) ? d.contents : []).slice(0, MAX_ITEMS).flatMap((c: unknown) => {
    if (!c || typeof c !== "object") return [];
    const { id, quantity, item_price } = c as Record<string, unknown>;
    if (!isId(id) || typeof item_price !== "number" || !Number.isFinite(item_price) || item_price < 0 || item_price > 1_000_000) return [];
    const q = typeof quantity === "number" && Number.isFinite(quantity) ? Math.min(MAX_QTY, Math.max(1, Math.floor(quantity))) : 1;
    return [{ id, quantity: q, item_price }];
  });
  if (!contents.length) return null;
  const out: Record<string, unknown> = {
    content_type: "product",
    content_ids: contents.map((c) => c.id),
    contents,
    num_items: contents.reduce((n, c) => n + c.quantity, 0),
    value: Math.round(contents.reduce((n, c) => n + c.item_price * c.quantity, 0) * 100) / 100,
    currency: "EGP",
  };
  if (typeof d.content_name === "string" && d.content_name) out.content_name = d.content_name.slice(0, 100);
  if (typeof d.source === "string" && /^[a-z_]{1,32}$/.test(d.source)) out.source = d.source;
  return out;
}

export async function POST(req: Request) {
  if (!PIXEL || !TOKEN) return new NextResponse(null, { status: 204 });
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof body.event_name !== "string" || !ALLOWED.has(body.event_name) || !isId(body.event_id)) return new NextResponse(null, { status: 400 });
  const customData = cleanCustomData(body.custom_data);
  if (!customData) return new NextResponse(null, { status: 400 });
  // The page the event happened on, kept only when it is a page of this storefront.
  const sourceUrl = typeof body.event_source_url === "string" && ownHost(req, hostOf(body.event_source_url)) ? body.event_source_url.slice(0, 1000) : undefined;

  const cookies = req.headers.get("cookie");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const event = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: {
      client_ip_address: ip,
      client_user_agent: req.headers.get("user-agent") ?? undefined,
      fbp: cookie(cookies, "_fbp"),
      fbc: cookie(cookies, "_fbc"),
    },
    custom_data: customData,
  };

  try {
    // The token travels in the body, never in a URL that logs and proxies could keep.
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${PIXEL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event], access_token: TOKEN, ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}) }),
      cache: "no-store",
    });
    if (!res.ok) console.error("[meta] CAPI rejected the event:", res.status, await res.text());
  } catch (err) {
    console.error("[meta] CAPI unreachable:", err);
  }
  return new NextResponse(null, { status: 204 });
}
