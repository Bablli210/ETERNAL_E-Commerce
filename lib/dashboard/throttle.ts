import "server-only";

/**
 * Guards that run before any password hash or store access, kept in memory
 * on each server instance (never in the store: Hobby's Blob allowance is too
 * small for a write per failed attempt). They exist to protect the CPU
 * allowance as much as the passwords: a hash costs about 0.4 s of CPU, and
 * Hobby pauses the whole project when its monthly CPU runs out. A long
 * password policy is what makes guessing hopeless.
 *
 * - Failed attempts are counted per IP and per username (known or not, so a
 *   lockout never reveals which usernames exist): 8 in 15 minutes locks that
 *   key for the rest of the 15 minutes.
 * - At most 2 hashes at once and 20 an hour per instance; past that, sign-in
 *   says "busy" (existing sessions keep working).
 * - An unknown username costs no hash: the answer waits about as long as a
 *   real check instead.
 */
type Window = { n: number; reset: number };
type State = { fails: Map<string, Window>; budget: Window; running: number; avgMs: number };
const g = globalThis as unknown as { __eternalDashThrottle?: State };
const st = (g.__eternalDashThrottle ??= { fails: new Map(), budget: { n: 0, reset: 0 }, running: 0, avgMs: 450 });

const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 8;
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

/** For an unknown username: wait about as long as a real check would, without spending CPU. */
export const waitLikeAHash = () => new Promise((r) => setTimeout(r, st.avgMs * (0.85 + Math.random() * 0.3)));

/** One "Refresh now" per 5 minutes per instance: each refresh calls Shopify and Meta, and Meta allows little. */
let lastRefresh = 0;
export function takeRefreshSlot(): boolean {
  const now = Date.now();
  if (now - lastRefresh < 5 * 60_000) return false;
  lastRefresh = now;
  return true;
}
