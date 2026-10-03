// Scans the prerendered pages after `next build` for [bracketed] placeholder
// text a customer could see. Warns by default; STRICT_PLACEHOLDERS=1 fails the
// build (use it for the launch build). /launch-checklist is meant to list them.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), ".next", "server", "app");
const SKIP = ["launch-checklist"];
const hits = [];

const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) check(p);
  }
};

const check = (file) => {
  const route = "/" + path.relative(ROOT, file).replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  if (SKIP.some((s) => route.includes(s))) return;
  const visible = fs
    .readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  const found = [...new Set(visible.match(/\[[A-Za-z][^\]\n]{1,90}\]/g) ?? [])];
  if (found.length) hits.push({ route, found });
};

if (!fs.existsSync(ROOT)) {
  console.log("check-placeholders: no build output, skipped");
  process.exit(0);
}
walk(ROOT);
if (!hits.length) {
  console.log("check-placeholders: no placeholder text on any prerendered page");
  process.exit(0);
}
console.warn(`check-placeholders: ${hits.length} page(s) show placeholder text:`);
for (const h of hits.slice(0, 30)) console.warn(`  ${h.route}: ${h.found.slice(0, 4).join(" ")}`);
process.exit(process.env.STRICT_PLACEHOLDERS === "1" ? 1 : 0);
