import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves image slots against real files in `public/images/`.
 *
 * Every image on the site is referenced by a base name without an extension,
 * so a file can arrive as .jpg, .png, .webp or .avif and be picked up without
 * a code change. Nothing is required: a slot with no matching file keeps
 * rendering its labelled placeholder, so images can land in any order.
 *
 * public/images/README.md lists every name the site looks for.
 */
const ROOT = path.join(process.cwd(), "public", "images");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

function scan(): Map<string, string> {
  const found = new Map<string, string>();
  const walk = (dir: string, prefix: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // no images folder yet
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!EXTENSIONS.includes(ext)) continue;
      const base = rel.slice(0, -ext.length);
      // First extension wins, in EXTENSIONS order, so an .avif never beats the .jpg it was made from.
      const existing = found.get(base);
      if (existing && EXTENSIONS.indexOf(path.extname(existing).toLowerCase()) <= EXTENSIONS.indexOf(ext)) continue;
      found.set(base, `/images/${rel}`);
    }
  };
  walk(ROOT, "");
  return found;
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
