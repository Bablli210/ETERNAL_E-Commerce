import { NextResponse } from "next/server";

/**
 * Meta Conversions API: the server copy of a browser pixel event. The browser
 * sends the same event id it gave the pixel, so Meta keeps one of the pair.
 * Off unless NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_TOKEN are both set.
 * Purchase is not sent from here; Shopify's Facebook & Instagram channel owns it.
 */
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";
const ALLOWED = new Set(["ViewContent", "AddToCart"]);

type Body = { event_name?: string; event_id?: string; event_source_url?: string; custom_data?: Record<string, unknown> };

const cookie = (header: string | null, name: string) => header?.split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? undefined;

export async function POST(req: Request) {
  if (!PIXEL || !TOKEN) return new NextResponse(null, { status: 204 });
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body.event_name || !ALLOWED.has(body.event_name) || !body.event_id) return new NextResponse(null, { status: 400 });

  const cookies = req.headers.get("cookie");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const event = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id.slice(0, 100),
    action_source: "website",
    event_source_url: body.event_source_url?.slice(0, 1000),
    user_data: {
      client_ip_address: ip,
      client_user_agent: req.headers.get("user-agent") ?? undefined,
      fbp: cookie(cookies, "_fbp"),
      fbc: cookie(cookies, "_fbc"),
    },
    custom_data: body.custom_data,
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${VERSION}/${PIXEL}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
    });
    if (!res.ok) console.error("[meta] CAPI rejected the event:", res.status, await res.text());
  } catch (err) {
    console.error("[meta] CAPI unreachable:", err);
  }
  return new NextResponse(null, { status: 204 });
}
