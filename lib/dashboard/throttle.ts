import "server-only";

/**
 * Guards that run before any password hash or store access, kept in memory
 * on each server instance (never in the store: Hobby's Blob allowance is too
 * small for a write per failed attempt). They exist to protect the CPU
 * allowance as much as the passwords: a hash costs about 0.4 s of CPU, and
 * Hobby pauses the whole project when its monthly CPU runs out. A long
 * password policy is what makes guessing hopeless.
 *
 * - Failed attempts (a password checked and found wrong) are counted per IP
 *   and per username (known or not, so a lockout never reveals which
 *   usernames exist): 5 in an hour locks that key for the rest of the hour.
 *   A refusal for being busy is not a failed attempt and is never counted.
 * - Every hash is also charged to its source, an hour at a time: sign-in,
 *   invite, reset and setup to the visitor's IP (8), a password change to
 *   the person (3). So no single visitor or account can use the shared
 *   budget up. A busy refusal gives the slot back (no password was
 *   checked), and a person's first 2 sign-ins an hour give the IP's slot
 *   back, so colleagues behind one office address don't share 8.
 * - At most 2 hashes at once and 20 an hour per instance; past that, sign-in
 *   says to wait (existing sessions keep working). An unknown username takes
 *   a slot like a real one, so "busy" never tells which usernames exist, but
 *   it costs no hash: the answer waits about as long as a real check.
 */
type Window = { n: number; reset: number };
type State = { fails: Map<string, Window>; budget: Window; running: number; avgMs: number };
const g = globalThis as unknown as { __eternalDashThrottle?: State };
const st = (g.__eternalDashThrottle ??= { fails: new Map(), budget: { n: 0, reset: 0 }, running: 0, avgMs: 450 });

const WINDOW_MS = 60 * 60_000;
const MAX_FAILS = 5;
const HASHES_PER_HOUR = 20;
const MAX_PARALLEL = 2;

const count = (key: string, now: number) => {
  const w = st.fails.get(key);
  return w && w.reset > now ? w.n : 0;
};

export function locked(keys: string[]) {
  const now = Date.now();
  if (st.fails.size > 5000) for (const [k, w] of st.fails) if (w.reset <= now) st.fails.delete(k);
  return keys.some((k) => count(k, now) >= MAX_FAILS);
}

export function recordFailure(keys: string[]) {
  const now = Date.now();
  for (const k of keys) {
    const w = st.fails.get(k);
    if (w && w.reset > now) w.n++;
    else st.fails.set(k, { n: 1, reset: now + WINDOW_MS });
  }
}

export function clearFailures(keys: string[]) {
  for (const k of keys) st.fails.delete(k);
}

/** Runs a password hash within the instance's budget; null when refused (busy). */
export async function withHashBudget<T>(fn: () => Promise<T>): Promise<T | null> {
  const now = Date.now();
  if (st.budget.reset <= now) st.budget = { n: 0, reset: now + 3_600_000 };
  if (st.budget.n >= HASHES_PER_HOUR || st.running >= MAX_PARALLEL) return null;
  st.budget.n++;
  st.running++;
  const t = performance.now();
  try {
    return await fn();
  } finally {
    st.running--;
    st.avgMs = st.avgMs * 0.8 + (performance.now() - t) * 0.2;
  }
}

export const SLOTS = { ip: 8, passwordChange: 3, refundedSignIns: 2 } as const;
const slots = new Map<string, Window>();
/** One slot for this source this hour, or false when it has had its `max`. */
export function takeSlot(key: string, max: number): boolean {
  const now = Date.now();
  if (slots.size > 5000) for (const [k, w] of slots) if (w.reset <= now) slots.delete(k);
  const w = slots.get(key);
  if (!w || w.reset <= now) {
    slots.set(key, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (w.n >= max) return false;
  w.n++;
  return true;
}
export function releaseSlot(key: string) {
  const w = slots.get(key);
  if (w && w.reset > Date.now() && w.n > 0) w.n--;
}
/** After a correct password: the IP's slot comes back for the person's first 2 sign-ins this hour (an account signing in over and over still uses them up). */
export function refundIpSlot(ipKey: string, userId: string) {
  if (takeSlot(`ok:${userId}`, SLOTS.refundedSignIns)) releaseSlot(ipKey);
}

/** Minutes until hashes are allowed again: 1 when only the parallel limit refused, longer once the hour's budget is spent. */
export function hashWaitMinutes() {
  const now = Date.now();
  return st.budget.reset > now && st.budget.n >= HASHES_PER_HOUR ? Math.ceil((st.budget.reset - now) / 60_000) : 1;
}

/** For an unknown username: wait about as long as a real check would, without spending CPU. */
export const waitLikeAHash = () => new Promise((r) => setTimeout(r, st.avgMs * (0.85 + Math.random() * 0.3)));

/** One "sign out everywhere" per person per 10 minutes per instance: each is a Blob write, and Hobby allows 2,000 a month. */
const lastSignOutAll = new Map<string, number>();
export function takeSignOutAllSlot(userId: string): boolean {
  const now = Date.now();
  if (now - (lastSignOutAll.get(userId) ?? 0) < 10 * 60_000) return false;
  if (lastSignOutAll.size > 1000) lastSignOutAll.clear();
  lastSignOutAll.set(userId, now);
  return true;
}
/** Gives the slot back when the change could not be saved, so the person can retry at once. */
export const releaseSignOutAllSlot = (userId: string) => void lastSignOutAll.delete(userId);

/** One "Refresh now" per 5 minutes per instance: each refresh calls Shopify and Meta, and Meta allows little. */
let lastRefresh = 0;
export function takeRefreshSlot(): boolean {
  const now = Date.now();
  if (now - lastRefresh < 5 * 60_000) return false;
  lastRefresh = now;
  return true;
}
