import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt at OWASP's floor (N=2^17, r=8, p=1: about
 * 128 MB and 0.4 s per hash). The parameters travel with each hash, so they
 * can be raised later without breaking stored passwords. maxmem has to be set
 * above 128·N·r or Node refuses these parameters.
 */
const P = { log2N: 17, r: 8, p: 1, keylen: 32 };

const derive = (password: string, salt: Buffer, log2N: number, r: number, p: number, keylen: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keylen, { N: 2 ** log2N, r, p, maxmem: 256 * 2 ** log2N * r }, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, P.log2N, P.r, P.p, P.keylen);
  return `scrypt$${P.log2N}$${P.r}$${P.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, log2N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64url");
  // Bounds on stored parameters, so a damaged record cannot ask for gigabytes.
  if (+log2N < 14 || +log2N > 18 || +r < 1 || +r > 16 || +p < 1 || +p > 4 || want.length < 16 || want.length > 64) return false;
  const got = await derive(password, Buffer.from(salt, "base64url"), +log2N, +r, +p, want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Passwords: at least 15 characters, no composition rules (NIST SP 800-63B),
 * and none of the obvious ones. Returns the reason, or null when acceptable.
 */
const OBVIOUS = ["eternal", "myeternal", "password", "passw0rd", "123456789", "qwertyuiop", "dashboard", "performance"];
export function passwordProblem(password: string, username: string): string | null {
  if (password.length < 15) return "Use at least 15 characters. A short sentence works well.";
  if (password.length > 128) return "Use at most 128 characters.";
  const flat = password.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  if (new Set(flat).size < 5) return "Choose something less repetitive.";
  // What is left once the username, the shop's name and the usual suspects are taken out must still be long.
  let rest = flat;
  for (const w of [username.toLowerCase().replace(/[^a-z0-9]/g, ""), ...OBVIOUS].filter((w) => w.length >= 3)) rest = rest.split(w).join("");
  if (rest.length < 10) return "Choose something that isn't built from your username or the shop's name.";
  return null;
}
