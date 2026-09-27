// A tiny static server for the reel folder (fonts and fetch() need http, not file://).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

export function serve(root) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.join(root, p === "/" ? "index.html" : p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      res.end(buf);
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}

export const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Open the reel in a page and wait until it is ready. Throws the reel's own error if it fails. */
export async function openReel(browser, base, query = "") {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}/index.html${query}`);
  try {
    await page.waitForFunction(() => window.__reel || window.__reelError, null, { timeout: 180000 });
  } catch (e) {
    throw new Error(`reel did not become ready: ${errors.join(" | ") || e.message}`);
  }
  const err = await page.evaluate(() => window.__reelError);
  if (err) throw new Error(`reel failed: ${err}${errors.length ? " | " + errors.join(" | ") : ""}`);
  return { page, errors };
}
