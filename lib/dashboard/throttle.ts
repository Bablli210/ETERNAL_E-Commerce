import "server-only";

/**
 * Guards that run before any password hash or store access, kept in memory
 * on each server instance (never in the store: Hobby's Blob allowance is too
 * small for a write per failed attempt). They exist to protect the CPU
 * allowance as much as the passwords: a hash costs about 0.4 s of CPU, and
 * Hobby pauses the whole project, shop included, when its monthly CPU runs
 * out. A long password policy is what makes guessing hopeless.
 *
 * - Failed attempts (a password checked and found wrong) are counted per
 *   network and username together: 5 in an hour locks that pair for the
 *   rest of the hour. Guessing from one address never locks the person out
 *   anywhere else, and one colleague's mistakes never lock the office out.
 *   A refusal for being busy is not a failed attempt and is never counted.
 * - Every hash is charged to its source, an hour at a time: sign-in, invite,
 *   reset and setup to the visitor's network (8) and, for sign-in, to the
 *   username typed (10, known or not); a password change to the person (3).
 *   A busy refusal gives the slots back (no password was checked), and a
 *   person's first 2 sign-ins an hour give the network's slot back, so
 *   colleagues behind one office address don't share 8.
 * - At most 2 hashes at once and 20 an hour per instance. 8 of the 20 are
 *   kept for people signing in on a device they have used before (a sealed
 *   cookie, lib/dashboard/session.ts), for signed-in password changes, and
 *   for whoever holds a live invite or reset link or the setup code, so
 *   visitors with none of these can never use them up. An unknown username costs
 *   no hash and is not charged, but is refused exactly like a real one when
 *   the budget is full, so "busy" never tells which usernames exist.
 */
type Window = { n: number; reset: number };
type State = { fails: Map<string, Window>; budget: Window; running: number; avgMs: number };
const g = globalThis as unknown as { __eternalDashThrottle?: State };
const st = (g.__eternalDashThrottle ??= { fails: new Map(), budget: { n: 0, reset: 0 }, running: 0, avgMs: 450 });

const WINDOW_MS = 60 * 60_000;
const MAX_FAILS = 5;
const HASHES_PER_HOUR = 20;
/** Of the 20, how many only known devices, signed-in people and link or setup-code holders may use. */
const RESERVED = 8;
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

const limitFor = (trusted: boolean) => (trusted ? HASHES_PER_HOUR : HASHES_PER_HOUR - RESERVED);

/**
 * Runs a password hash within the instance's budget; null when refused
 * (busy). trusted: a known device or a signed-in person, who may use the
 * reserved part. charge: false for the unknown-username wait, which runs no
 * hash but is admitted and refused by the same rule.
 */
export async function withHashBudget<T>(fn: () => Promise<T>, { trusted = false, charge = true }: { trusted?: boolean; charge?: boolean } = {}): Promise<T | null> {
  const now = Date.now();
  if (st.budget.reset <= now) st.budget = { n: 0, reset: now + WINDOW_MS };
  if (st.budget.n >= limitFor(trusted) || st.running >= MAX_PARALLEL) return null;
  if (charge) st.budget.n++;
  st.running++;
  const t = performance.now();
  try {
    return await fn();
  } finally {
    st.running--;
    if (charge) st.avgMs = st.avgMs * 0.8 + (performance.now() - t) * 0.2;
  }
}

/** Minutes until hashes are allowed again: 1 when only the parallel limit refused, longer once the hour's budget is spent. */
export function hashWaitMinutes(trusted = false) {
  const now = Date.now();
  return st.budget.reset > now && st.budget.n >= limitFor(trusted) ? Math.ceil((st.budget.reset - now) / 60_000) : 1;
}

export const SLOTS = { ip: 8, username: 10, device: 4, passwordChange: 3, refundedSignIns: 2 } as const;
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

/** For an unknown username: wait about as long as a real check would, without spending CPU. */
export const waitLikeAHash = () => new Promise((r) => setTimeout(r, st.avgMs * (0.85 + Math.random() * 0.3)));

/** One "sign out everywhere" per person per 10 minutes per instance (a daily cap is kept in the account itself). */
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
