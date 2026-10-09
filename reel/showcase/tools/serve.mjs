// A static server rooted at the repository, so the showcase reads the site's own
// fonts (app/fonts), photographs (public/images) and the direction film's
// Cormorant files (reel/fonts) without copying them.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..", "..", "..");
export const PAGE = "/reel/showcase/index.html";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

export function serve(root = ROOT) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.join(root, p);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      res.end(buf);
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

export const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
// WebGL through ANGLE on SwiftShader: the same software rasteriser on every machine, so frames match.
export const CHROMIUM_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync"];

/** Open the showcase in a page and wait until it is ready. Throws the film's own error if it fails. */
export async function openShowcase(browser, base, query = "") {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}${PAGE}${query}`);
  try {
    await page.waitForFunction(() => window.__film || window.__filmError, null, { timeout: 300000 });
  } catch (e) {
    throw new Error(`showcase did not become ready: ${errors.join(" | ") || e.message}`);
  }
  const err = await page.evaluate(() => window.__filmError);
  if (err) throw new Error(`showcase failed: ${err}${errors.length ? " | " + errors.join(" | ") : ""}`);
  return { page, errors };
}
