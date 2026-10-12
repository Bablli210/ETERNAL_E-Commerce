import "server-only";
import { unstable_cache } from "next/cache";
import type { BostaRow, BostaSnapshot } from "./types";

/**
 * Bosta's own view of the shipments, with the business API key
 * (BOSTA_API_KEY; Bosta > Settings > API integration). Shopify already
 * carries the delivery milestones Bosta's Shopify app reports back
 * (lib/dashboard/ops.ts), so this adds what only Bosta knows: the cash on
 * delivery per shipment, attempts and exception reasons, returns to the
 * business. Bosta's public reference was offline when this was written, so
 * the reader takes the field names its SDKs use, classifies by the state's
 * words (code 45 is Delivered in every version), and lists the field names
 * Bosta actually sent for the owner's check. It only ever reads.
 */
const LOG = "[dashboard/bosta]";
const TIMEOUT_MS = 15_000;
const LIMIT = 50;
const MAX_PAGES = 10;
const DAYS = 60;

type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const obj = (v: unknown): Raw | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null);

/** A state's words and code, whether Bosta sends { code, value }, a bare code, or a word. */
function stateOf(d: Raw): { code: number | null; label: string } {
  const s = obj(d.state);
  if (s) return { code: num(s.code), label: str(s.value) ?? str(s.name) ?? (num(s.code) !== null ? `State ${num(s.code)}` : "Unknown") };
  const code = num(d.state);
  return { code, label: str(d.stateValue) ?? str(d.status) ?? (code !== null ? `State ${code}` : "Unknown") };
}

function classify(code: number | null, label: string): BostaRow["state"] {
  const w = label.toLowerCase();
  if (code === 45 || /\bdelivered\b/.test(w)) return "delivered";
  if (/return/.test(w)) return "returned";
  if (/terminat|cancel|lost|damag/.test(w)) return "failed";
  if (/exception|fail|not answer|reschedul/.test(w)) return "attempted";
  if (/out for delivery|delivering|on route/.test(w)) return "out";
  if (/picked|received|transit|warehouse|hub|fulfil|route/.test(w)) return "in_transit";
  if (/pickup requested|pending|created|new|request/.test(w)) return "waiting";
  return "unknown";
}

function toRow(d: Raw): BostaRow {
  const { code, label } = stateOf(d);
  const attemptsList = Array.isArray(d.attempts) ? d.attempts.length : null;
  const s = obj(d.state);
  return {
    tracking: str(d.trackingNumber) ?? str(d.tracking_number) ?? str(d._id) ?? "",
    reference: str(d.businessReference) ?? str(d.business_reference),
    state: classify(code, label),
    stateLabel: label,
    cod: num(d.cod) ?? num(d.codAmount) ?? num(d.cashOnDelivery),
    createdAt: str(d.createdAt),
    updatedAt: str(d.updatedAt),
    attempts: num(d.numberOfAttempts) ?? num(d.attemptsCount) ?? attemptsList,
    exception: str(d.exceptionReason) ?? str(obj(s?.exception)?.reason) ?? str(d.lastExceptionReason),
  };
}

class BostaError extends Error {
  constructor(
    readonly kind: string,
    readonly status = 0,
  ) {
    super(kind);
  }
}

const messageFor = (e: unknown) => {
  const k = e instanceof BostaError ? e.kind : "internal";
  if (k === "bad_key") return "Bosta did not accept the API key. Make a new one in Bosta > Settings > API integration and replace BOSTA_API_KEY in Vercel.";
  if (k === "timeout" || k === "unreachable") return "Bosta could not be reached just now. The dashboard tries again at the next refresh.";
  if (k === "bad_response") return "Bosta answered in a shape the dashboard doesn't know. The owner details list what it sent.";
  return `Bosta answered with an error${e instanceof BostaError && e.status ? ` (HTTP ${e.status})` : ""}. It usually passes.`;
};

async function page(base: string, key: string, n: number): Promise<{ list: Raw[]; count: number | null }> {
  let res: Response;
  try {
    res = await fetch(`${base}/deliveries?pageNumber=${n}&limit=${LIMIT}`, {
      headers: { Authorization: key, Accept: "application/json", "X-Requested-By": "eternal-dashboard" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new BostaError(e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? "timeout" : "unreachable");
  }
  if (res.status === 401 || res.status === 403) throw new BostaError("bad_key", res.status);
  const body = obj(await res.json().catch(() => null));
  if (!res.ok || !body) throw new BostaError(res.ok ? "bad_response" : `http_${res.status}`, res.status);
  if (body.success === false) throw new BostaError(/auth|key|token/i.test(String(body.message ?? "")) ? "bad_key" : "bad_response", res.status);
  const data = body.data;
  const list = Array.isArray(data) ? data : Array.isArray(obj(data)?.deliveries) ? (obj(data)!.deliveries as unknown[]) : null;
  if (!list) throw new BostaError("bad_response", res.status);
  return { list: list.map(obj).filter((d): d is Raw => d !== null), count: num(obj(data)?.count) };
}

async function read(): Promise<BostaSnapshot> {
  const now = new Date();
  const key = (process.env.BOSTA_API_KEY ?? "").trim();
  const base = ((process.env.BOSTA_API_BASE ?? "").trim() || "https://app.bosta.co/api/v1").replace(/\/+$/, "");
  const snap: BostaSnapshot = { state: "error", failure: null, fetchedAt: now.toISOString(), rows: [], fields: [] };
  if (!key) {
    snap.state = "off";
    snap.failure = { kind: "not_configured", message: "Bosta isn't connected. Add BOSTA_API_KEY in Vercel, then redeploy." };
    return snap;
  }
  const since = now.getTime() - DAYS * 86_400_000;
  const raw: Raw[] = [];
  try {
    for (let n = 1; n <= MAX_PAGES; n++) {
      const { list, count } = await page(base, key, n);
      raw.push(...list);
      const oldest = list.map((d) => Date.parse(str(d.createdAt) ?? "")).filter(Number.isFinite).sort()[0];
      if (list.length < LIMIT || (count !== null && raw.length >= count) || (oldest !== undefined && oldest < since)) break;
    }
  } catch (e) {
    console.error(`${LOG} read failed`, e instanceof BostaError ? { kind: e.kind, status: e.status } : String(e));
    snap.failure = { kind: e instanceof BostaError ? e.kind : "internal", message: messageFor(e) };
    return snap;
  }
  snap.fields = [...new Set(raw.slice(0, 20).flatMap((d) => Object.keys(d)))].sort();
  snap.rows = raw.map(toRow).filter((r) => !r.createdAt || Date.parse(r.createdAt) >= since);
  snap.state = "ok";
  return snap;
}

const passes = (kind: string | undefined) => !!kind && (["timeout", "unreachable"].includes(kind) || /^http_5\d\d$/.test(kind));
class Passing extends Error {
  constructor(readonly snap: BostaSnapshot) {
    super(`bosta: ${snap.failure?.message ?? "failed for a moment"}`);
  }
}

const cachedRead = unstable_cache(
  async () => {
    const snap = await read();
    if (snap.state === "error" && passes(snap.failure?.kind)) throw new Passing(snap);
    return snap;
  },
  ["dash-bosta-v1", process.env.VERCEL_DEPLOYMENT_ID ?? "local"],
  { revalidate: 900, tags: ["dash-data", "dash-bosta"] },
);

/** Bosta's shipments of the last 60 days, cached 15 minutes. Never throws. */
export async function getBostaSnapshot(): Promise<BostaSnapshot> {
  try {
    return await cachedRead();
  } catch (e) {
    if (e instanceof Passing) return e.snap;
    console.error(`${LOG} unexpected failure`, e instanceof Error ? e.message : String(e));
    return { state: "error", failure: { kind: "internal", message: "Bosta could not be read just now." }, fetchedAt: new Date().toISOString(), rows: [], fields: [] };
  }
}
