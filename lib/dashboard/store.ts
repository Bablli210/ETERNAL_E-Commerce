import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

/**
 * The dashboard's few small JSON documents (accounts), kept in the project's
 * private Vercel Blob store. Each lives at one fixed path per environment and
 * is changed by read → modify → conditional write (ifMatch on the etag), so
 * two owners saving at once never overwrite each other. Hobby allows 2,000
 * writes and 10,000 uncached reads a month, so pages never read here
 * directly: lib/dashboard/accounts.ts keeps a cached copy and only account
 * changes write.
 *
 * Without a connected store (local development) the documents are files in
 * the system temp folder, so sign-in can be tried on a laptop. In production
 * a missing store is an error the page reports, never a silent fallback.
 */
export type Stored<T> = { data: T; etag: string };

export class StoreUnavailable extends Error {}
export class StoreConflict extends Error {}

const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const env = () => process.env.VERCEL_ENV ?? "development";
const usesFiles = () => !blobConfigured() && process.env.NODE_ENV !== "production";

/** Whether documents can be read and written here at all. */
export const storeReady = () => blobConfigured() || usesFiles();

/**
 * The Blob SDK retries a timed-out call with the same aborted signal, so its
 * own timeout does not bound it: past this, the caller gets StoreUnavailable
 * (a write may still land; changeAccounts refreshes the cached copy either way).
 */
function within<T>(ms: number, p: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StoreUnavailable(`no answer within ${ms / 1000} s`)), ms);
  });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
}

const blobPath = (name: string) => `dashboard/${env()}/${name}.json`;
const filePath = (name: string) => join(process.env.DASHBOARD_STORE_DIR?.trim() || join(tmpdir(), "eternal-dashboard"), `${name}.json`);
const tag = (text: string) => createHash("sha256").update(text).digest("base64url");

/** The current document, or null when it has never been written. Throws when the store cannot be reached, so a failure is never mistaken for "no accounts yet". */
export async function readDoc<T>(name: string): Promise<Stored<T> | null> {
  if (usesFiles()) {
    try {
      const text = await readFile(filePath(name), "utf8");
      return { data: JSON.parse(text) as T, etag: tag(text) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw new StoreUnavailable(`local store: ${(err as Error).message}`);
    }
  }
  if (!blobConfigured()) throw new StoreUnavailable("No Blob store is connected to this deployment.");
  try {
    // useCache: false reads the latest copy from storage, not the CDN, so a write never starts from a stale etag.
    return await within(9000, (async () => {
      const res = await get(blobPath(name), { access: "private", useCache: false, abortSignal: AbortSignal.timeout(8000) });
      if (!res) return null;
      if (res.statusCode !== 200) throw new StoreUnavailable(`unexpected status ${res.statusCode}`);
      const text = await new Response(res.stream).text();
      return { data: JSON.parse(text) as T, etag: res.blob.etag };
    })());
  } catch (err) {
    if (err instanceof StoreUnavailable) throw err;
    throw new StoreUnavailable(err instanceof Error ? err.message : "Blob read failed");
  }
}

/**
 * Writes the document if nobody changed it since `etag` was read (etag null:
 * only if it does not exist yet). Throws StoreConflict when someone did, so
 * the caller reads again and retries.
 */
export async function writeDoc<T>(name: string, data: T, etag: string | null): Promise<void> {
  const text = JSON.stringify(data);
  if (usesFiles()) {
    const path = filePath(name);
    const current = await readFile(path, "utf8").catch(() => null);
    if (etag === null ? current !== null : current === null || tag(current) !== etag) throw new StoreConflict("changed since read");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, { mode: 0o600 });
    return;
  }
  if (!blobConfigured()) throw new StoreUnavailable("No Blob store is connected to this deployment.");
  try {
    await within(
      9000,
      put(blobPath(name), text, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
        abortSignal: AbortSignal.timeout(8000),
      }),
    );
  } catch (err) {
    // A create-only write that finds the document already there is also a lost race.
    if (err instanceof BlobPreconditionFailedError || (etag === null && /already exists/i.test(String((err as Error)?.message)))) throw new StoreConflict("changed since read");
    throw new StoreUnavailable(err instanceof Error ? err.message : "Blob write failed");
  }
}
