// Times each render stage at a few moments (scene, depth of field, bloom, grade), for tuning.
//   node reel/showcase/tools/profile.mjs
import { chromium } from "playwright-core";
import { serve, openShowcase, CHROMIUM, CHROMIUM_ARGS } from "./serve.mjs";
const server = await serve();
const browser = await chromium.launch({ executablePath: CHROMIUM, args: CHROMIUM_ARGS });
const { page } = await openShowcase(browser, server.url, "?profile");
for (const t of [2, 6, 11, 22]) {
  const r = await page.evaluate(async (t) => { for (const k in window.__film.times) delete window.__film.times[k]; await window.__film.seek(t, { samples: 1 }); return JSON.stringify(Object.fromEntries(Object.entries(window.__film.times).map(([k, v]) => [k, Math.round(v)]))); }, t);
  console.log(`t=${t}: ${r}`);
}
await browser.close(); server.close();
