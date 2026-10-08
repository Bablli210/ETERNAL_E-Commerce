"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import {
  changeAccounts,
  clientIp,
  currentViewer,
  getAccounts,
  logEvent,
  nowSec,
  recentSignIn,
  ROLES,
  sameOriginPost,
  stillOwner,
  USERNAME,
  type AccountsDoc,
  type User,
} from "@/lib/dashboard/accounts";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/dashboard/kdf";
import { cookieOptions, DEVICE_COOKIE, DEVICE_DAYS, deviceUid, seal, sealDevice, SESSION_COOKIE, SESSION_DAYS } from "@/lib/dashboard/session";
import { clearFailures, hashWaitMinutes, locked, recordFailure, refundIpSlot, releaseSignOutAllSlot, releaseSlot, SLOTS, takeRefreshSlot, takeSignOutAllSlot, takeSlot, waitLikeAHash, withHashBudget } from "@/lib/dashboard/throttle";
import { dashboardOrigin } from "@/lib/dashboard/origin";
import { StoreUnavailable } from "@/lib/dashboard/store";
import type { Role } from "@/lib/dashboard/types";

/**
 * Every change to dashboard accounts. Each action is a public endpoint, so
 * each checks who is calling itself; failures come back as plain sentences
 * for the form (useActionState), success redirects. Nothing here ever stores
 * or sends an email address.
 */
export type FormState = { error?: string; ok?: string } | null;
export type LinkState = { error?: string; link?: { id?: string; url: string; name: string; role?: Role; expires: string } } | null;

const sha = (s: string) => createHash("sha256").update(s).digest("base64url");
const text = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").slice(0, max);
const newId = () => randomBytes(12).toString("base64url");
const INVITE_DAYS = 7;
const RESET_HOURS = 24;
const BUSY = "The dashboard is busy. Try again in a minute.";
const LOCKED = "Too many tries. Wait an hour, then try again.";
const SIGNED_OUT = "You've been signed out. Sign in again, then retry.";
/** When the hashing budget refuses: a minute when only the parallel limit did, longer once the hour's budget is spent. */
const hashBusy = (trusted = false) => {
  const m = hashWaitMinutes(trusted);
  return m <= 1 ? BUSY : `Sign-in is paused after many attempts. Try again in about ${m} minutes.`;
};
/**
 * A password hash charged to one source (lib/dashboard/throttle.ts): refused
 * with a sentence once that source has had its share this hour, or when the
 * instance is busy, and a busy refusal gives the share back.
 */
async function hashAs<T>(
  slots: { key: string; max: number; full: string }[],
  fn: () => Promise<T>,
  budget: { trusted?: boolean; charge?: boolean } = {},
): Promise<{ value: T } | { error: string }> {
  const taken: string[] = [];
  const giveBack = () => taken.forEach(releaseSlot);
  for (const s of slots) {
    if (!takeSlot(s.key, s.max)) {
      giveBack();
      return { error: s.full };
    }
    taken.push(s.key);
  }
  const value = await withHashBudget(fn, budget);
  if (value === null) {
    giveBack();
    return { error: hashBusy(budget.trusted) };
  }
  return { value };
}
const FROM_HERE = "Too many attempts from this network in the last hour. Try again later.";
const ipSlot = (ipKey: string) => ({ key: ipKey, max: SLOTS.ip, full: FROM_HERE });
const fromIp = <T>(ipKey: string, fn: () => Promise<T>) => hashAs([ipSlot(ipKey)], fn);

/** Password changes and sign-outs everywhere a person may make in a day: each is a store write, and Hobby allows 2,000 a month. */
const SELF_PER_DAY = 4;
const recentSelf = (u: User) => (u.selfChanges ?? []).filter((t) => t > nowSec() - 86_400);
const SELF_LIMIT = "You've changed your password or signed out everywhere several times today. Try again tomorrow, or ask an owner.";

/** Ends this browser's session. The deletion must carry the same attributes (Secure, Path=/) or browsers ignore it for a __Host- cookie. */
const endSession = async () => (await cookies()).set(SESSION_COOKIE, "", cookieOptions(0));
const UNREACHABLE = "The account store can't be reached just now. Try again in a minute.";
const ADD_NAME = "Add your name: up to 60 characters, not an email address.";
const TAKEN = "That username is taken. Pick another.";
const NOT_AN_OWNER = "That username belongs to someone who isn't an owner. Pick another.";
const NO_SUCH_OWNER = "No owner has that username. Check it, or fill in your name only if you mean to add a new owner.";
/** The page lost the token from its link (a browser that cleared the tab's storage): not a wrong or used link, so not counted against anyone. */
const LOST_LINK = "This page lost its link. Open the link again from your message.";

/** A display name: a first name or two, never an email address. */
function displayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 60 && !name.includes("@") ? name : null;
}

/** Signs this browser in, and marks it as a device this person uses (lib/dashboard/session.ts). */
async function startSession(user: Pick<User, "id" | "sv">, secret: string) {
  const iat = nowSec();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, seal({ uid: user.id, sv: user.sv, iat, exp: iat + SESSION_DAYS * 86_400 }, secret), cookieOptions(SESSION_DAYS * 86_400));
  jar.set(DEVICE_COOKIE, sealDevice(user.id, secret), cookieOptions(DEVICE_DAYS * 86_400));
}

/** Store failures become a sentence, never a crash page. */
async function guarded<T, F = T>(fn: () => Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof StoreUnavailable) {
      console.error("[dashboard] account store:", err.message);
      return fallback;
    }
    throw err;
  }
}

const lastActiveOwner = (doc: AccountsDoc, userId: string) => {
  const owners = doc.users.filter((u) => u.role === "owner" && !u.disabled);
  return owners.length === 1 && owners[0].id === userId;
};

/* ------------------------------------------------------------- Signing in */

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const username = text(fd, "username", 64).trim().toLowerCase();
  const password = text(fd, "password", 256);
  const ipKey = `ip:${await clientIp()}`;
  // Failures count for this network and username together (lib/dashboard/throttle.ts).
  const pair = [`try:${ipKey}:${username}`];
  if (locked(pair)) return { error: LOCKED };
  const doc = await guarded(() => getAccounts(), undefined);
  if (doc === undefined) return { error: UNREACHABLE };
  const user = doc?.users.find((u) => u.username === username && !u.disabled);
  const jar = await cookies();
  // A browser this person signed in on before may use the hashes kept back for known devices, a few times an hour.
  const knownDevice = Boolean(user && doc && deviceUid(jar.get(DEVICE_COOKIE)?.value, doc.secret) === user.id && takeSlot(`dev:${user.id}`, SLOTS.device));
  // Known or not, every attempt takes the same slots and is admitted by the same rule, so "busy" and its timing never tell which
  // usernames exist; an unknown one only waits, and is not charged for a hash it never runs.
  const checked = knownDevice
    ? await hashAs([], () => verifyPassword(password, (user as User).pw), { trusted: true })
    : await hashAs(
        [ipSlot(ipKey), { key: `name:${username}`, max: SLOTS.username, full: "Too many sign-in attempts for this username in the last hour. Try again later, or sign in on a device you've used before." }],
        () => (user ? verifyPassword(password, user.pw) : waitLikeAHash().then(() => false)),
        { charge: Boolean(user) },
      );
  if ("error" in checked) {
    if (knownDevice && user) releaseSlot(`dev:${user.id}`);
    return { error: checked.error };
  }
  if (!checked.value || !user || !doc) {
    recordFailure(pair);
    return { error: "That username and password don't match." };
  }
  clearFailures(pair);
  if (!knownDevice) refundIpSlot(ipKey, user.id);
  await startSession(user, doc.secret);
  redirect("/dashboard");
}

export async function signOut() {
  await endSession();
  redirect("/dashboard/sign-in");
}

/* ------------------------------------------------------------- First owner */

/**
 * The first owner, with the one-time DASHBOARD_SETUP_CODE. The code is checked
 * before anything is read, works once, and also recovers access when every
 * owner is locked out: a NEW code with an existing owner's username sets that
 * owner's password again and signs out their old sessions.
 */
export async function completeSetup(_prev: FormState, fd: FormData): Promise<FormState> {
  const envCode = process.env.DASHBOARD_SETUP_CODE?.trim() ?? "";
  if (envCode.length < 24) return { error: "Setup is switched off." };
  const ipKey = [`ip:${await clientIp()}`];
  if (locked(ipKey)) return { error: LOCKED };
  const code = text(fd, "code", 200).trim();
  if (!timingSafeEqual(Buffer.from(sha(code)), Buffer.from(sha(envCode)))) {
    recordFailure(ipKey);
    return { error: "That setup code isn't right." };
  }
  const username = text(fd, "username", 64).trim().toLowerCase();
  const rawName = text(fd, "name", 100).trim();
  const name = displayName(rawName);
  const password = text(fd, "password", 256);
  if (!USERNAME.test(username)) return { error: "Usernames are 3 to 32 lower-case letters, numbers, dots, dashes or underscores (not an email address)." };
  const problem = passwordProblem(password, username);
  if (problem) return { error: problem };
  if (password !== text(fd, "confirm", 256)) return { error: "The two passwords don't match." };
  // No usable name for a username no account has: a name that was typed but refused needs fixing; an empty one in recovery means the username is wrong.
  const missingName = (doc: AccountsDoc | null) => (rawName || !doc?.users.some((u) => u.role === "owner") ? "noname" : "nouser");

  const before = await guarded(() => getAccounts(), undefined);
  if (before === undefined) return { error: UNREACHABLE };
  if ((before?.setupCodesUsed ?? []).includes(sha(envCode))) return { error: "This setup code has already been used. Ask for a new one, or sign in." };
  // Checked before hashing, so a mistake costs no hash: in recovery an empty name means "set my password", never "make a new owner".
  const existing = before?.users.find((u) => u.username === username);
  if (existing && existing.role !== "owner") return { error: NOT_AN_OWNER };
  if (!name && !existing) return { error: missingName(before) === "nouser" ? NO_SUCH_OWNER : ADD_NAME };
  const hashed = await fromIp(ipKey[0], () => hashPassword(password));
  if ("error" in hashed) return { error: hashed.error };
  const pw = hashed.value;

  const out: { who: User | null } = { who: null };
  const result = await guarded(
    () =>
      changeAccounts((current) => {
        const doc: AccountsDoc = current ?? { v: 1, secret: randomBytes(32).toString("base64url"), users: [], links: [], setupCodesUsed: [], events: [] };
        if (doc.setupCodesUsed.includes(sha(envCode))) return "used";
        const existing = doc.users.find((u) => u.username === username);
        if (existing) {
          if (existing.role !== "owner") return "taken";
          Object.assign(existing, { pw, sv: existing.sv + 1, disabled: false, pwChangedAt: new Date().toISOString() });
          out.who = existing;
          logEvent(doc, username, "recovered owner access with a setup code");
        } else {
          if (!name) return missingName(doc);
          out.who = { id: newId(), username, name, role: "owner", pw, sv: 1, disabled: false, createdAt: new Date().toISOString(), createdBy: null, pwChangedAt: new Date().toISOString() };
          doc.users.push(out.who);
          logEvent(doc, username, "set up the dashboard");
        }
        doc.setupCodesUsed.push(sha(envCode));
        return doc;
      }),
    "unreachable" as const,
  );
  if (result === "used") return { error: "This setup code has already been used." };
  if (result === "taken") return { error: NOT_AN_OWNER };
  if (result === "noname") return { error: ADD_NAME };
  if (result === "nouser") return { error: NO_SUCH_OWNER };
  if (typeof result === "string" || !out.who) return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  await startSession(out.who, result.secret);
  redirect("/dashboard");
}

/* ------------------------------------------------- Invite and reset links */

async function ownerOrError(): Promise<{ viewer: NonNullable<Awaited<ReturnType<typeof currentViewer>>> } | { error: string }> {
  if (!(await sameOriginPost())) return { error: "Open the dashboard again and retry." };
  const viewer = await guarded(() => currentViewer(), "unreachable" as const);
  if (viewer === "unreachable") return { error: UNREACHABLE };
  if (!viewer) return { error: SIGNED_OUT };
  if (viewer.role !== "owner") return { error: "Only owners can do this." };
  if (!recentSignIn(viewer)) return { error: "For safety, sign out and in again before changing people (you signed in more than 12 hours ago)." };
  return { viewer };
}

const expiresText = (unix: number) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(unix * 1000)) + " Cairo";

export async function createInvite(_prev: LinkState, fd: FormData): Promise<LinkState> {
  const auth = await ownerOrError();
  if ("error" in auth) return { error: auth.error };
  const name = displayName(text(fd, "name", 100));
  const role = ROLES.find((r) => r === fd.get("role")) ?? "client";
  if (!name) return { error: "Add the person's first name (not an email address)." };
  const token = randomBytes(32).toString("base64url");
  const expiresAt = nowSec() + INVITE_DAYS * 86_400;
  const result = await guarded(
    () =>
      changeAccounts((doc) => {
        if (!doc) return "nodoc";
        if (!stillOwner(doc, auth.viewer)) return "signedout";
        if (doc.links.filter((l) => l.expiresAt > nowSec()).length >= 20) return "toomany";
        doc.links.push({ id: newId(), kind: "invite", tokenHash: sha(token), role, name, createdBy: auth.viewer.username, createdAt: new Date().toISOString(), expiresAt });
        logEvent(doc, auth.viewer.username, `made an invite link (${role})`, name);
        return doc;
      }),
    "unreachable" as const,
  );
  if (result === "toomany") return { error: "There are 20 open links already. Revoke some first." };
  if (result === "signedout") return { error: SIGNED_OUT };
  if (typeof result === "string") return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  // The token goes after #, which browsers never send to a server, so it stays out of logs and link previews.
  return { link: { url: `${await dashboardOrigin()}/dashboard/join#${token}`, name, role, expires: expiresText(expiresAt) } };
}

export async function createResetLink(_prev: LinkState, fd: FormData): Promise<LinkState> {
  const auth = await ownerOrError();
  if ("error" in auth) return { error: auth.error };
  const userId = text(fd, "userId", 64);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = nowSec() + RESET_HOURS * 3600;
  const linkId = newId(); // made once, so a retried write keeps the id the page shows the link under
  let name = "";
  const result = await guarded(
    () =>
      changeAccounts((doc) => {
        const u = doc?.users.find((x) => x.id === userId);
        if (doc && !stillOwner(doc, auth.viewer)) return "signedout";
        if (!doc || !u) return "nouser";
        name = u.name;
        doc.links = doc.links.filter((l) => !(l.kind === "reset" && l.userId === userId));
        doc.links.push({ id: linkId, kind: "reset", tokenHash: sha(token), userId, createdBy: auth.viewer.username, createdAt: new Date().toISOString(), expiresAt });
        logEvent(doc, auth.viewer.username, "made a password reset link", u.username);
        return doc;
      }),
    "unreachable" as const,
  );
  if (result === "nouser") return { error: "That person no longer has an account." };
  if (result === "signedout") return { error: SIGNED_OUT };
  if (typeof result === "string") return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  return { link: { id: linkId, url: `${await dashboardOrigin()}/dashboard/reset#${token}`, name, expires: expiresText(expiresAt) } };
}

/** Looks a link up in the cached copy first, so a wrong or old link costs no store read. */
async function findLink(token: string, kind: "invite" | "reset") {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const doc = await getAccounts();
  return doc?.links.find((l) => l.kind === kind && l.tokenHash === sha(token) && l.expiresAt > nowSec()) ?? null;
}

export async function acceptInvite(_prev: FormState, fd: FormData): Promise<FormState> {
  const ipKey = [`ip:${await clientIp()}`];
  if (locked(ipKey)) return { error: LOCKED };
  const token = text(fd, "token", 100);
  if (!token) return { error: LOST_LINK };
  const link = await guarded(() => findLink(token, "invite"), undefined);
  if (link === undefined) return { error: UNREACHABLE };
  if (!link) {
    recordFailure(ipKey);
    return { error: "This invite link has expired or was already used. Ask for a new one." };
  }
  const username = text(fd, "username", 64).trim().toLowerCase();
  const name = displayName(text(fd, "name", 100)) ?? link.name ?? null;
  const password = text(fd, "password", 256);
  if (!USERNAME.test(username)) return { error: "Usernames are 3 to 32 lower-case letters, numbers, dots, dashes or underscores (not an email address)." };
  if (!name) return { error: "Add your name (not an email address)." };
  const problem = passwordProblem(password, username);
  if (problem) return { error: problem };
  if (password !== text(fd, "confirm", 256)) return { error: "The two passwords don't match." };
  // A taken username is refused before hashing, so retrying one costs nothing; the check inside the change still covers a race.
  if ((await guarded(() => getAccounts(), null))?.users.some((u) => u.username === username)) return { error: TAKEN };
  const hashed = await fromIp(ipKey[0], () => hashPassword(password));
  if ("error" in hashed) return { error: hashed.error };
  const pw = hashed.value;
  const out: { who: User | null } = { who: null };
  const result = await guarded(
    () =>
      changeAccounts((doc) => {
        const l = doc?.links.find((x) => x.id === link.id && x.expiresAt > nowSec());
        if (!doc || !l) return "link";
        if (doc.users.some((u) => u.username === username)) return "taken";
        doc.links = doc.links.filter((x) => x.id !== l.id); // one use
        out.who = { id: newId(), username, name, role: l.role ?? "client", pw, sv: 1, disabled: false, createdAt: new Date().toISOString(), createdBy: l.createdBy, pwChangedAt: new Date().toISOString() };
        doc.users.push(out.who);
        logEvent(doc, username, `joined as ${out.who.role}`, `invited by ${l.createdBy}`);
        return doc;
      }),
    "unreachable" as const,
  );
  if (result === "link") return { error: "This invite link has expired or was already used. Ask for a new one." };
  if (result === "taken") return { error: TAKEN };
  if (typeof result === "string" || !out.who) return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  await startSession(out.who, result.secret);
  redirect("/dashboard");
}

export async function applyResetLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const ipKey = [`ip:${await clientIp()}`];
  if (locked(ipKey)) return { error: LOCKED };
  const token = text(fd, "token", 100);
  if (!token) return { error: LOST_LINK };
  const link = await guarded(() => findLink(token, "reset"), undefined);
  if (link === undefined) return { error: UNREACHABLE };
  if (!link) {
    recordFailure(ipKey);
    return { error: "This reset link has expired or was already used. Ask an owner for a new one." };
  }
  const doc = await guarded(() => getAccounts(), null);
  const user = doc?.users.find((u) => u.id === link.userId);
  if (!user) return { error: "This account no longer exists." };
  if (user.disabled) return { error: "This account is paused. Ask an owner to let you back in." };
  const password = text(fd, "password", 256);
  const problem = passwordProblem(password, user.username);
  if (problem) return { error: problem };
  if (password !== text(fd, "confirm", 256)) return { error: "The two passwords don't match." };
  const hashed = await fromIp(ipKey[0], () => hashPassword(password));
  if ("error" in hashed) return { error: hashed.error };
  const pw = hashed.value;
  const out: { who: User | null } = { who: null };
  const result = await guarded(
    () =>
      changeAccounts((d) => {
        const l = d?.links.find((x) => x.id === link.id && x.expiresAt > nowSec());
        const u = d?.users.find((x) => x.id === link.userId);
        if (!d || !l || !u || u.disabled) return "link";
        d.links = d.links.filter((x) => x.id !== l.id);
        Object.assign(u, { pw, sv: u.sv + 1, pwChangedAt: new Date().toISOString() });
        out.who = u;
        logEvent(d, u.username, "set a new password with a reset link");
        return d;
      }),
    "unreachable" as const,
  );
  if (result === "link") return { error: "This reset link has expired or was already used. Ask an owner for a new one." };
  if (typeof result === "string" || !out.who) return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  await startSession(out.who, result.secret);
  redirect("/dashboard");
}

/* ----------------------------------------------------------- Managing people */

/** One owner action on one person: role, pause, remove, sign out everywhere, or revoke a link. */
export async function managePerson(_prev: FormState, fd: FormData): Promise<FormState> {
  const auth = await ownerOrError();
  if ("error" in auth) return { error: auth.error };
  const what = text(fd, "what", 20);
  const id = text(fd, "id", 64);
  const role = ROLES.find((r) => r === fd.get("role"));
  let done = "";
  const result = await guarded(
    () =>
      changeAccounts((doc) => {
        if (!doc) return "Nothing to change yet.";
        if (!stillOwner(doc, auth.viewer)) return SIGNED_OUT;
        if (what === "revoke") {
          const l = doc.links.find((x) => x.id === id);
          if (!l) return "That link is already gone.";
          doc.links = doc.links.filter((x) => x.id !== id);
          logEvent(doc, auth.viewer.username, `revoked a${l.kind === "invite" ? "n invite" : " reset"} link`, l.kind === "invite" ? l.name : doc.users.find((x) => x.id === l.userId)?.username);
          done = "Link revoked.";
          return doc;
        }
        const u = doc.users.find((x) => x.id === id);
        if (!u) return "That person no longer has an account.";
        const self = u.id === auth.viewer.id;
        if (what === "role") {
          if (!role) return "Choose a role.";
          if (u.role === role) {
            // Nothing to save, and no reason to sign them out: a second tap must not change anything.
            done = `${u.name} is already ${role === "owner" ? "an owner" : role === "team" ? "on the team" : "a client"}.`;
            return "unchanged";
          }
          if (u.role === "owner" && role !== "owner" && lastActiveOwner(doc, u.id)) return "There must always be one owner. Make someone else an owner first.";
          u.role = role;
          u.sv++; // their next page load picks the new role; old open pages stop working
          done = `${u.name} is now ${role === "owner" ? "an owner" : role === "team" ? "on the team" : "a client"}.`;
        } else if (what === "pause" || what === "resume") {
          if (what === "pause" && (self || lastActiveOwner(doc, u.id))) return self ? "You can't pause your own account." : "There must always be one owner.";
          u.disabled = what === "pause";
          u.sv++;
          // A reset link sent before the pause must not let them back in.
          const cancelled = what === "pause" && doc.links.some((l) => l.userId === u.id && l.expiresAt > nowSec());
          if (what === "pause") doc.links = doc.links.filter((l) => l.userId !== u.id);
          done = what === "pause" ? `${u.name} can no longer sign in.${cancelled ? " Their open reset link is cancelled." : ""}` : `${u.name} can sign in again.`;
        } else if (what === "signout") {
          u.sv++;
          done = `${u.name} is signed out everywhere.`;
        } else if (what === "remove") {
          if (self) return "You can't remove yourself.";
          if (lastActiveOwner(doc, u.id)) return "There must always be one owner.";
          doc.users = doc.users.filter((x) => x.id !== u.id);
          doc.links = doc.links.filter((l) => l.userId !== u.id);
          done = `${u.name}'s account is removed.`;
        } else return "Unknown change.";
        const verb: Record<string, string> = { pause: "paused access for", resume: "let back in", signout: "signed out everywhere", remove: "removed" };
        logEvent(doc, auth.viewer.username, what === "role" ? `changed the role to ${role} for` : verb[what], u.username);
        return doc;
      }),
    "unreachable" as const,
  );
  if (result === "unchanged") return { ok: done };
  if (typeof result === "string") return { error: result === "unreachable" ? UNREACHABLE : result === "busy" ? BUSY : result };
  return { ok: done };
}

/* -------------------------------------------------------------- Own account */

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await sameOriginPost())) return { error: "Open the dashboard again and retry." };
  const viewer = await guarded(() => currentViewer(), "unreachable" as const);
  if (viewer === "unreachable") return { error: UNREACHABLE };
  if (!viewer) return { error: SIGNED_OUT };
  const doc = await guarded(() => getAccounts(), null);
  const user = doc?.users.find((u) => u.id === viewer.id);
  if (!user) return { error: UNREACHABLE };
  const current = text(fd, "current", 256);
  const password = text(fd, "password", 256);
  if (recentSelf(user).length >= SELF_PER_DAY) return { error: SELF_LIMIT };
  const problem = passwordProblem(password, user.username);
  if (problem) return { error: problem };
  if (password !== text(fd, "confirm", 256)) return { error: "The two new passwords don't match." };
  // Two hashes per change, charged to the person (3 tries an hour, from anywhere); a signed-in person may use the reserved hashes.
  const slot = `pw:${user.id}`;
  const checked = await hashAs([{ key: slot, max: SLOTS.passwordChange, full: "You've tried to change your password several times this hour. Try again later." }], () => verifyPassword(current, user.pw), {
    trusted: true,
  });
  if ("error" in checked) return { error: checked.error };
  if (!checked.value) return { error: "Your current password isn't right." };
  const pw = await withHashBudget(() => hashPassword(password), { trusted: true });
  if (!pw) {
    releaseSlot(slot);
    return { error: hashBusy(true) };
  }
  const out: { who: User | null } = { who: null };
  const result = await guarded(
    () =>
      changeAccounts((d) => {
        const u = d?.users.find((x) => x.id === viewer.id);
        if (!d || !u || u.sv !== viewer.sv) return "gone";
        if (recentSelf(u).length >= SELF_PER_DAY) return "limit";
        Object.assign(u, { pw, sv: u.sv + 1, pwChangedAt: new Date().toISOString(), selfChanges: [...recentSelf(u), nowSec()] });
        out.who = u;
        logEvent(d, u.username, "changed their password");
        return d;
      }),
    "unreachable" as const,
  );
  if (result === "limit") return { error: SELF_LIMIT };
  if (result === "gone") return { error: SIGNED_OUT };
  if (typeof result === "string" || !out.who) return { error: result === "unreachable" ? UNREACHABLE : BUSY };
  // New password, new session: every other device is signed out, this one stays in.
  await startSession(out.who, result.secret);
  return { ok: "Password changed. You're signed out everywhere else." };
}

/** Ends every session of the person asking, this one included; only once the store has the change, so it never claims what it didn't do. */
export async function signOutEverywhere(): Promise<FormState> {
  if (!(await sameOriginPost())) return { error: "Open the dashboard again and retry." };
  const viewer = await guarded(() => currentViewer(), "unreachable" as const);
  if (viewer === "unreachable") return { error: UNREACHABLE };
  if (!viewer) return { error: SIGNED_OUT };
  const cached = (await guarded(() => getAccounts(), null))?.users.find((u) => u.id === viewer.id);
  if (cached && recentSelf(cached).length >= SELF_PER_DAY) return { error: SELF_LIMIT };
  if (!takeSignOutAllSlot(viewer.id)) return { error: "You did this a few minutes ago. Try again in 10 minutes, or change your password." };
  const result = await guarded(
    () =>
      changeAccounts((d) => {
        const u = d?.users.find((x) => x.id === viewer.id);
        if (!d || !u || u.sv !== viewer.sv) return "gone";
        if (recentSelf(u).length >= SELF_PER_DAY) return "limit";
        u.sv++;
        u.selfChanges = [...recentSelf(u), nowSec()];
        logEvent(d, u.username, "signed out everywhere");
        return d;
      }),
    "unreachable" as const,
  );
  if (typeof result === "string") {
    releaseSignOutAllSlot(viewer.id);
    return { error: result === "unreachable" ? UNREACHABLE : result === "gone" ? SIGNED_OUT : result === "limit" ? SELF_LIMIT : BUSY };
  }
  await endSession();
  redirect("/dashboard/sign-in");
}

/* ------------------------------------------------------------- The figures */

/** Fresh figures from Shopify and Meta's ad numbers, for owners and team, at most every 5 minutes. */
export async function refreshFigures(): Promise<FormState> {
  if (!(await sameOriginPost())) return { error: "Open the dashboard again and retry." };
  const viewer = await guarded(() => currentViewer(), "unreachable" as const);
  if (viewer === "unreachable") return { error: UNREACHABLE };
  if (!viewer) return { error: SIGNED_OUT };
  if (viewer.role === "client") return { error: "Only owners and the team can refresh." };
  if (!takeRefreshSlot()) return { error: "Figures were refreshed in the last 5 minutes. Try again shortly." };
  updateTag("dash-shopify");
  updateTag("dash-meta-ads");
  updateTag("dash-site");
  return { ok: "Refreshing. The figures update in a few seconds." };
}
