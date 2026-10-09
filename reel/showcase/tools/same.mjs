// Marks which recorded frames repeat the one before (same bytes), so the renderer only
// spends motion-blur sub-frames where something on screen actually moves.
//   node reel/showcase/tools/same.mjs      → assets/rec/<take>/same.json
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const REC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "rec");
for (const id of fs.readdirSync(REC)) {
  const dir = path.join(REC, id, "mid");
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).sort();
  let prev = null, moving = 0;
  const same = files.map((f) => {
    const h = crypto.createHash("md5").update(fs.readFileSync(path.join(dir, f))).digest("hex");
    const s = h === prev;
    prev = h;
    if (!s) moving++;
    return s ? 1 : 0;
  });
  fs.writeFileSync(path.join(REC, id, "same.json"), JSON.stringify(same));
  console.log(`${id}: ${files.length} frames, ${moving} change`);
}
