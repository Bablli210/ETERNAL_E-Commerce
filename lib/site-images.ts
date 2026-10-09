import "server-only";
import path from "node:path";
import { IMAGE_EXTENSIONS, imageVersions } from "./image-versions";

/**
 * Resolves image slots against real files in `public/images/`.
 *
 * Every image on the site is referenced by a base name without an extension,
 * so a file can arrive as .jpg, .png, .webp or .avif and be picked up without
 * a code change. Nothing is required: a slot with no matching file keeps
 * rendering its labelled placeholder, so images can land in any order.
 *
 * The address carries its folder's version (lib/image-versions.ts), so a
 * picture replaced under the same name shows at once instead of its cached copy.
 *
 * public/images/README.md lists every name the site looks for.
 */
function scan(): Map<string, string> {
  const found = new Map<string, { ext: string; url: string }>();
  for (const { rel, url } of imageVersions().files) {
    const ext = path.extname(rel).toLowerCase();
    const base = rel.slice(0, -ext.length);
    // First extension wins, in IMAGE_EXTENSIONS order, so an .avif never beats the .jpg it was made from.
    const existing = found.get(base);
    if (existing && IMAGE_EXTENSIONS.indexOf(existing.ext) <= IMAGE_EXTENSIONS.indexOf(ext)) continue;
    found.set(base, { ext, url });
  }
  return new Map([...found].map(([base, { url }]) => [base, url]));
}

let cached: Map<string, string> | null = null;

/** Re-scans on every call in development so a dropped-in file shows on refresh. */
function manifest(): Map<string, string> {
  if (process.env.NODE_ENV === "development") return scan();
  if (!cached) cached = scan();
  return cached;
}

/** The public path of the first name that has a file, or null. */
export function siteImage(name: string | string[]): string | null {
  const names = Array.isArray(name) ? name : [name];
  const files = manifest();
  for (const n of names) {
    const hit = files.get(n);
    if (hit) return hit;
  }
  return null;
}

/** How many image files are installed. Used by the build report only. */
export function siteImageCount(): number {
  return manifest().size;
}
