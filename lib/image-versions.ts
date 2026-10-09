import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

/** Next allows at most 25 local patterns; past this many folders, one version covers them all. */
const MAX_GROUPS = 20;

/**
 * Every image file under public/images, and a version for each folder (the top level, products/, ...): a short
 * hash of the folder's file names and sizes.
 *
 * Site images are addressed as `/images/<file>?v=<version>`, so a picture replaced under the same name gets a new
 * address and shows at once. Without it the old picture lingers: Vercel keeps an optimised copy per source address,
 * and browsers keep theirs for the month next.config.ts allows. Sizes rather than modification times, because the
 * build and the server must agree and a fresh checkout resets every modification time. One version per folder, not
 * per file, because next.config.ts admits each version to the image optimiser as an exact query (no other query
 * passes, so it cannot be made to store endless variants of one picture) and Next takes at most 25 such patterns.
 * The cost: changing one picture refreshes its folder's others once.
 *
 * Used by lib/site-images.ts and next.config.ts, so it must not import anything server-only.
 */
export function imageVersions(root = path.join(process.cwd(), "public", "images")) {
  const files: { rel: string; group: string; size: number }[] = [];
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
      if (!IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) continue;
      files.push({ rel, group: rel.includes("/") ? rel.slice(0, rel.indexOf("/")) : "", size: fs.statSync(path.join(dir, entry.name)).size });
    }
  };
  walk(root, "");
  // "" is the top level; "*" stands for every folder at once.
  const groupNames = [...new Set(files.map((f) => f.group))];
  const single = groupNames.length > MAX_GROUPS;
  const groupOf = (f: { group: string }) => (single ? "*" : f.group);
  const versions = new Map<string, string>();
  for (const g of single ? ["*"] : groupNames) {
    const lines = files.filter((f) => groupOf(f) === g).map((f) => `${f.rel}:${f.size}`).sort();
    versions.set(g, createHash("sha1").update(lines.join("\n")).digest("hex").slice(0, 10));
  }
  return {
    /** Each file's address, with its folder's version. */
    files: files.map((f) => ({ rel: f.rel, url: `/images/${f.rel}?v=${versions.get(groupOf(f))}` })),
    /** The image optimiser's allow-list entries for these versions (next.config.ts). */
    patterns: [...versions].map(([g, v]) => ({ pathname: g === "*" ? "/images/**" : g ? `/images/${g}/**` : "/images/*", search: `?v=${v}` })),
  };
}
