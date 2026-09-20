import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves video slots against real files in `public/videos/`, the same way
 * `lib/site-images.ts` resolves stills: a slot names a base name, and the
 * clip appears once a file with that name lands. Nothing is required — a slot
 * with no file keeps rendering its poster, so the site never waits on video.
 *
 * WebM is offered first and MP4 second, so each browser takes the format it
 * decodes best. Both are optional; one of the two is enough.
 */
const ROOT = path.join(process.cwd(), "public", "videos");

export type VideoSources = { webm: string | null; mp4: string | null };

function scan(): Map<string, VideoSources> {
  const found = new Map<string, VideoSources>();
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(ROOT, { withFileTypes: true });
  } catch {
    return found; // no videos folder yet
  }
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== ".mp4" && ext !== ".webm") continue;
    const base = entry.name.slice(0, -ext.length);
    const sources = found.get(base) ?? { webm: null, mp4: null };
    if (ext === ".webm") sources.webm = `/videos/${entry.name}`;
    else sources.mp4 = `/videos/${entry.name}`;
    found.set(base, sources);
  }
  return found;
}

let cached: Map<string, VideoSources> | null = null;

/** Re-scans on every call in development so a dropped-in file shows on refresh. */
function manifest(): Map<string, VideoSources> {
  if (process.env.NODE_ENV === "development") return scan();
  if (!cached) cached = scan();
  return cached;
}

/** The sources for a base name, or null when no file exists for it. */
export function siteVideo(name: string): VideoSources | null {
  const hit = manifest().get(name);
  if (!hit || (!hit.webm && !hit.mp4)) return null;
  return hit;
}
