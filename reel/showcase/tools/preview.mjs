// Stills and contact sheets of the showcase, for checking work.
//   node reel/showcase/tools/preview.mjs --at 2,4.5,8           # full-size stills
//   node reel/showcase/tools/preview.mjs --sheet 30             # 30 evenly spaced frames on one sheet
//   node reel/showcase/tools/preview.mjs --from 3.5 --to 5 --sheet 12 --samples 4
//   node reel/showcase/tools/preview.mjs --check 7.3            # determinism: same pixels after other frames
// Writes to reel/showcase/review/ (not committed). Prints the time each frame took.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { serve, openShowcase, CHROMIUM, CHROMIUM_ARGS } from "./serve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "review");
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const samples = Number(opt("samples", 1));
const tag = opt("tag", "");

const server = await serve();
const browser = await chromium.launch({ executablePath: CHROMIUM, args: CHROMIUM_ARGS });
try {
  const { page, errors } = await openShowcase(browser, server.url, `?samples=${samples}${args.includes("--debug") ? "&debug" : ""}`);
  const { duration } = await page.evaluate(() => ({ duration: window.__film.duration }));
  const shot = async (t) => {
    const t0 = Date.now();
    await page.evaluate(([x, n]) => window.__film.seek(x, { samples: n }), [t, samples]);
    const ms = Date.now() - t0;
    const buf = await page.screenshot({ type: "png" });
    return { buf, ms };
  };
  if (opt("at")) {
    for (const t of opt("at").split(",").map(Number)) {
      const { buf, ms } = await shot(t);
      const f = path.join(OUT, `still-${tag}${t.toFixed(2)}.jpg`);
      await sharp(buf).jpeg({ quality: 92 }).toFile(f);
      console.log(`${t.toFixed(2)}s  ${ms} ms  → ${path.relative(process.cwd(), f)}`);
    }
  }
  if (opt("sheet")) {
    const n = Number(opt("sheet"));
    const from = Number(opt("from", 0)), to = Number(opt("to", duration - 1 / 30));
    const cols = Number(opt("cols", n <= 12 ? 4 : 6));
    const tw = 480, th = 270;
    const tiles = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? from : from + ((to - from) * i) / (n - 1);
      const { buf, ms } = await shot(t);
      const label = Buffer.from(`<svg width="${tw}" height="${th}"><rect x="0" y="0" width="74" height="22" fill="black" opacity="0.6"/><text x="6" y="16" font-family="monospace" font-size="14" fill="#0f0">${t.toFixed(2)}s</text></svg>`);
      tiles.push(await sharp(buf).resize(tw, th).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer());
      process.stdout.write(`${t.toFixed(2)}s ${ms}ms  `);
    }
    console.log();
    const rows = Math.ceil(n / cols);
    const sheet = sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: "#000" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th })));
    const f = path.join(OUT, `sheet-${tag}${from}-${to}.jpg`);
    await sheet.jpeg({ quality: 88 }).toFile(f);
    console.log(`sheet → ${path.relative(process.cwd(), f)}`);
  }
  if (opt("check")) {
    const t = Number(opt("check"));
    const a = await shot(t);
    await shot(Math.max(0, t - 6.3));
    await shot(Math.min(duration - 0.1, t + 9.1));
    const b = await shot(t);
    const ra = await sharp(a.buf).raw().toBuffer(), rb = await sharp(b.buf).raw().toBuffer();
    let diff = 0;
    for (let i = 0; i < ra.length; i++) if (Math.abs(ra[i] - rb[i]) > 2) diff++;
    console.log(diff === 0 ? `determinism: ok at ${t}s` : `determinism: ${diff} channel values differ at ${t}s`);
  }
  if (errors.length) console.log("page errors:", errors.join(" | "));
} finally {
  await browser.close();
  server.close();
}
