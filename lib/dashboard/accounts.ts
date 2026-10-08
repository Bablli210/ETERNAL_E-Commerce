import "server-only";
import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { readDoc, writeDoc, StoreConflict } from "./store";
import { SESSION_COOKIE, unseal } from "./session";
import type { Role, Viewer } from "./types";

/**
 * Dashboard accounts: one private document (lib/dashboard/store.ts) with the
 * people, their one-time links, the session secret and a short audit trail.
 * No email address is ever stored: people have a username and a display name,
 * and invites are links an owner sends by hand.
 *
 * Roles: owner (everything, plus People: invite, reset, remove), team (all
 * figures, refresh), client (all figures, read only). Pages read a cached
 * copy, refreshed at once after every change (updateTag) and otherwise once
 * an hour, so viewing the dashboard costs no store reads.
 */
export type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  /** scrypt hash (lib/dashboard/kdf.ts). */
  pw: string;
  /** Session version: raised to sign this person out everywhere. */
  sv: number;
  disabled: boolean;
  createdAt: string;
  createdBy: string | null;
  pwChangedAt: string;
  /** When this person last changed their password or signed out everywhere (Unix seconds, the last day only): each is a store write, so a day allows a few. */
  selfChanges?: number[];
};
/** A one-time link: an invite (makes a new account) or a reset (sets a new password). Only the token's SHA-256 is kept. */
export type Link = {
  id: string;
  kind: "invite" | "reset";
  tokenHash: string;
  role?: Role;
  name?: string;
  userId?: string;
  createdBy: string;
  createdAt: string;
  /** Unix seconds. */
  expiresAt: number;
};
export type AccountEvent = { at: string; actor: string; action: string; target?: string };
export type AccountsDoc = {
  v: 1;
  /** Seals session cookies (lib/dashboard/session.ts). */
  secret: string;
  users: User[];
  links: Link[];
  /** SHA-256 of every setup code already used, so each works once. */
  setupCodesUsed: string[];
  /** The last 100 account changes. */
  events: AccountEvent[];
};

const DOC = "accounts";
export const ACCOUNTS_TAG = "dash-accounts";
export const ROLES: readonly Role[] = ["owner", "team", "client"];
export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", team: "Team", client: "Client" };
export const USERNAME = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const nowSec = () => Math.floor(Date.now() / 1000);

/** The cached document; null before setup. Throws (and caches nothing) when the store cannot be reached. */
export const getAccounts = unstable_cache(async () => (await readDoc<AccountsDoc>(DOC))?.data ?? null, ["dash-accounts-v1"], {
  revalidate: 3600,
  tags: [ACCOUNTS_TAG],
});

/** The signed-in person, or null. Read once per request. */
export const currentViewer = cache(async (): Promise<(Viewer & { iat: number; sv: number }) | null> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const doc = await getAccounts();
  if (!doc) return null;
  const s = unseal(raw, doc.secret);
  if (!s) return null;
  const u = doc.users.find((x) => x.id === s.uid);
  if (!u || u.disabled || u.sv !== s.sv) return null;
  return { id: u.id, name: u.name, username: u.username, role: u.role, iat: s.iat, sv: u.sv };
});

/** For pages: the signed-in person with one of these roles, or off to sign in. */
export async function requireViewer(roles: readonly Role[] = ROLES) {
  const v = await currentViewer();
  if (!v) redirect("/dashboard/sign-in");
  if (!roles.includes(v.role)) redirect("/dashboard");
  return v;
}

/**
 * Inside a change: whether the person acting is, in the latest document, still
 * an active owner with the same session. The cached copy that let them in can
 * be a little behind (a change whose answer was lost), so every owner action
 * checks again here.
 */
export const stillOwner = (doc: AccountsDoc, v: { id: string; sv: number }) => doc.users.some((u) => u.id === v.id && u.role === "owner" && !u.disabled && u.sv === v.sv);

/** Owners change accounts only within 12 hours of signing in, so a forgotten open session cannot be used to add people. */
export const recentSignIn = (v: { iat: number }) => nowSec() - v.iat < 12 * 3600;

/**
 * Read the latest document, change it, write it back only if nobody changed it
 * meanwhile (retried a few times), then refresh the cached copy. `change`
 * returns the new document, or a string naming why it refused.
 *
 * The cached copy is refreshed whenever the store may now differ from it: after
 * every write attempt, including one whose answer was lost (it may have landed),
 * and after a refusal, which was decided on a fresh read. Not when the read
 * itself failed: then the cached copy is the best there is.
 */
export async function changeAccounts(change: (doc: AccountsDoc | null) => AccountsDoc | string): Promise<AccountsDoc | string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readDoc<AccountsDoc>(DOC);
    const next = change(current ? structuredClone(current.data) : null);
    if (typeof next === "string") {
      updateTag(ACCOUNTS_TAG);
      return next;
    }
    next.events = next.events.slice(-100);
    next.links = next.links.filter((l) => l.expiresAt > nowSec());
    try {
      await writeDoc(DOC, next, current?.etag ?? null);
      return next;
    } catch (err) {
      if (!(err instanceof StoreConflict)) throw err;
    } finally {
      updateTag(ACCOUNTS_TAG);
    }
  }
  return "busy";
}

export const logEvent = (doc: AccountsDoc, actor: string, action: string, target?: string) => {
  doc.events.push({ at: new Date().toISOString(), actor, action, ...(target ? { target } : {}) });
};

/** The visitor's IP as Vercel reports it (the platform overwrites these headers, so they cannot be forged). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Signed-in actions refuse a POST without an Origin header (browsers always
 * send one; Next only warns), and one Next forwarded from another page.
 */
export async function sameOriginPost() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!origin || !host || h.has("x-action-forwarded")) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
