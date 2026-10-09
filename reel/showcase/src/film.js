// The showcase: thirty seconds, one continuous camera, no cuts.
//
//   0.0  The e∞ mark, gold, found by a passing light. "A perfume house from Cairo."
//   3.6  The camera flies through the mark's eye…
//   4.6  …onto the bottle, on stone, in golden light. "Some things are never meant to fade."
//        Title: eternal, e-commerce storefront.
//   9.6  The home page powers on beside it and scrolls: first screen, three lines, where to start.
//  13.6  The camera tracks past the shop, a product page and the scent finder.
//  20.6  Three phones: the home page, a product, the bag.
//  25.4  Everything falls back into the dark; the mark returns over the end card.
//
// pose(t) sets every object for time t and returns what the pipeline needs; hud(t)
// sets the DOM type. Both are pure functions of t.
import * as THREE from "three";
import { tween, ease, envelope, track, drift, clamp, lerp } from "./ease.js";
import { text3d, animateText, sweepText } from "./type3d.js";
import { makeMark, makeBottle, makePlinth } from "./brand3d.js";
import { makeBrowser, makePhone, scrollTo } from "./devices.js";
import { makeSky, makeEnvironment, makeDust, makeShafts } from "./atmos.js";
import { caption, titleCard, endCard } from "./hud.js";

export const FPS = 30;
export const DURATION = 30;

const BEATS = [["mark", 0], ["through", 3.6], ["bottle", 4.6], ["home", 9.6], ["shop", 13.6], ["product", 15.9], ["finder", 18.2], ["mobile", 20.6], ["end", 25.4]];

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const A = (v) => [v.x, v.y, v.z];

export async function createFilm({ renderer, brand, pages, photos, hud }) {
  const scene = new THREE.Scene();
  const overlay = new THREE.Scene();
  const night = new THREE.Color("#171614");
  scene.fog = new THREE.FogExp2(night.clone(), 0.03);
  // Each lit material gets the studio as its own envMap (set at the end of the build): with
  // scene.environment, three.js would use one global intensity and the light could not
  // come up object by object.
  const env = makeEnvironment(renderer);

  const sky = makeSky();
  scene.add(sky.mesh);

  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.04, 400);

  // ── The mark, its right counter on the axis the camera flies through. ───────────
  const EYE = V(0, 0.64, -3.2);
  const mark = makeMark(brand, 3.0);
  mark.mesh.position.copy(EYE).sub(mark.eyes.right);
  scene.add(mark.mesh);
  const M = mark.mesh.position.clone();
  const sweepLight = new THREE.SpotLight(new THREE.Color("#ffd3a0"), 0, 6.0, 0.5, 0.9, 1);
  scene.add(sweepLight, sweepLight.target);
  sweepLight.target.position.copy(M);

  const houseLine = text3d({ lines: ["A perfume house from Cairo"], face: "sub", em: 0.095, px: 96, tracking: 0.32, caps: true, align: "center", split: "char", color: "#cdbfa5" });
  houseLine.group.position.set(M.x, M.y - 1.22, M.z + 0.05);
  scene.add(houseLine.group);

  // ── The bottle on its stone, golden light. ─────────────────────────────────────
  const B = V(0, 0, -8);
  const bottle = makeBottle(brand, { line: "eterna", name: "vintage vanilla" });
  bottle.group.position.copy(B);
  bottle.group.rotation.y = 0.18;
  scene.add(bottle.group);
  const plinth = makePlinth(photos["texture-wet-stone"]);
  plinth.mesh.position.x = B.x;
  plinth.mesh.position.z = B.z;
  scene.add(plinth.mesh);
  const BC = V(B.x, 0.6, B.z);

  const key = new THREE.SpotLight(new THREE.Color("#ffcf98"), 0, 20, 0.45, 0.8, 1.2);
  key.position.set(-3.2, 3.6, -5.2);
  key.target.position.copy(BC);
  const rim = new THREE.SpotLight(new THREE.Color("#ffb060"), 0, 20, 0.4, 0.7, 1.2);
  rim.position.set(2.6, 2.4, -11.5);
  rim.target.position.copy(BC);
  const fill = new THREE.PointLight(new THREE.Color("#8fa6b8"), 0, 12, 1.5);
  fill.position.set(3, 1.2, -4.5);
  scene.add(key, key.target, rim, rim.target, fill);

  const shafts = makeShafts(6);
  shafts.group.position.set(B.x - 0.6, 0, B.z - 3.2);
  scene.add(shafts.group);

  const tagline = text3d({ lines: ["Some things are", "never meant to fade."], face: "serif", em: 0.4, px: 220, tracking: -0.01, lineHeight: 1.04, align: "left", split: "word", color: "#f3efe7" });
  tagline.group.position.set(1.05, 1.32, -9.9);
  tagline.group.rotation.y = -0.16;
  scene.add(tagline.group);

  // ── The storefront on screens, on a line receding to the right. ────────────────
  const place = (obj, pos, rotY) => { obj.position.copy(pos); obj.rotation.y = rotY; obj.updateMatrixWorld(true); scene.add(obj); };
  const front = (obj, dist, dx = 0, dy = 0) => obj.localToWorld(V(dx, dy, dist));

  // A straight row receding to the right, every screen turned a little toward the track's
  // start; the camera dollies along a parallel track, so the screens pass at one distance.
  const ROW_Y = -0.2;
  const rowDir = V(1, 0, 0.03).normalize();
  const C0 = V(5.4, 1.62, -14.6);
  const rowAt = (k, dy = 0) => C0.clone().add(rowDir.clone().multiplyScalar(k)).add(V(0, dy, 0));
  const home = makeBrowser(pages["d-home"], 6.0);
  place(home.group, C0, ROW_Y);
  const shop = makeBrowser(pages["d-shop"], 5.2);
  place(shop.group, rowAt(8.2, -0.08), ROW_Y);
  const product = makeBrowser(pages["d-pdp"], 5.2);
  place(product.group, rowAt(15.6, 0.06), ROW_Y);
  const finder = makeBrowser(pages["d-finder"], 5.2);
  place(finder.group, rowAt(23.0, -0.05), ROW_Y);

  // ── Three phones, further down the row. ────────────────────────────────────────
  const PH = rowAt(31.0, -0.35);
  const phoneRig = new THREE.Group();
  place(phoneRig, PH, ROW_Y);
  const phones = [
    { p: makePhone(pages["m-pdp"], 2.25), at: V(-1.42, -0.12, -0.35), ry: 0.32, rz: 0.02 },
    { p: makePhone(pages["m-home"], 2.45), at: V(0, 0.05, 0.25), ry: 0, rz: 0 },
    { p: makePhone(pages["m-bag"], 2.25), at: V(1.42, -0.1, -0.35), ry: -0.32, rz: -0.02 },
  ];
  for (const ph of phones) { ph.p.group.position.copy(ph.at); phoneRig.add(ph.p.group); }
  const mobileWord = text3d({ lines: ["Made for the phone in your hand."], face: "serif", em: 0.34, px: 200, align: "center", split: "word", color: "#f3efe7" });
  mobileWord.group.position.set(0, 1.62, -0.9);
  phoneRig.add(mobileWord.group);

  // ── The end: the mark again, above the phones; the camera cranes up to it. ─────
  const endMark = makeMark(brand, 1.15);
  const END = phoneRig.localToWorld(V(0, 4.9, -0.6));
  place(endMark.mesh, END, ROW_Y);

  // ── Motes in the light: around the bottle, along the screens, by the phones. ───
  const mid = rowAt(11);
  const dust = [
    makeDust(260, [B.x, 1.4, B.z + 1.2], [7, 4, 7], 3),
    makeDust(360, [mid.x - 2, 1.6, mid.z + 6], [26, 5, 9], 5),
    makeDust(200, [PH.x - 1, 2.2, PH.z + 4], [8, 6, 6], 9),
  ];
  for (const d of dust) overlay.add(d.points);

  scene.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) { m.envMap = env; m.needsUpdate = true; }
  });
  const tagFocus = tagline.group.localToWorld(V(tagline.width * 0.45, -0.25, 0));

  // ── The camera: one path, keyed in time. ───────────────────────────────────────
  // A screen is framed upper right (the caption keeps the lower left), seen a little from the left.
  const L = (obj, x, y, z) => A(obj.localToWorld(V(x, y, z)));
  const shot = (scr, d) => L(scr.group, -1.5 - 0.55, -0.38 + 0.1, d);
  const aimAt = (scr) => L(scr.group, -1.5, -0.38, 0);
  const pos = track([
    { t: 0.0, v: A(M.clone().add(V(0.42, -0.06, 6.2))) },
    { t: 3.0, v: A(M.clone().add(V(0.22, -0.02, 4.4))) },
    { t: 3.85, v: A(EYE.clone().add(V(0.0, 0.0, 1.45))) },
    { t: 4.35, v: A(EYE.clone().add(V(0.0, 0.0, -0.15))) },
    { t: 5.4, v: [-0.15, 0.78, -4.3] },
    { t: 7.6, v: [-0.55, 0.88, -4.25] },
    { t: 8.9, v: [-0.35, 1.0, -3.7] },
    { t: 10.0, v: [1.6, 1.25, -5.0] },
    { t: 10.9, v: L(home.group, -1.5 - 0.5, -0.42 + 0.1, 9.9) },
    { t: 12.6, v: L(home.group, -1.5 - 0.5, -0.42 + 0.1, 9.0) },
    { t: 14.8, v: shot(shop, 8.5) },
    { t: 17.1, v: shot(product, 8.4) },
    { t: 19.4, v: shot(finder, 8.4) },
    { t: 22.1, v: L(phoneRig, -1.7, 0.7, 7.8) },
    { t: 24.5, v: L(phoneRig, -0.6, 0.75, 7.1) },
    { t: 27.3, v: L(phoneRig, 0, 3.95, 7.3) },
    { t: 30.0, v: L(phoneRig, 0, 3.95, 6.9) },
  ]);
  const aim = track([
    { t: 0.0, v: A(M.clone().add(V(0.12, -0.04, 0))) },
    { t: 3.0, v: A(M.clone().add(V(0.32, -0.08, 0))) },
    { t: 3.85, v: A(EYE.clone().add(V(0, -0.02, -3))) },
    { t: 4.35, v: [0.0, 0.62, -8] },
    { t: 5.4, v: [0.55, 0.66, -8.2] },
    { t: 7.6, v: [1.05, 0.76, -8.6] },
    { t: 8.9, v: [1.55, 0.88, -8.8] },
    { t: 10.0, v: L(home.group, -2.6, -0.4, 0) },
    { t: 10.9, v: L(home.group, -1.5, -0.42, 0) },
    { t: 12.6, v: L(home.group, -1.5, -0.42, 0) },
    { t: 14.8, v: aimAt(shop) },
    { t: 17.1, v: aimAt(product) },
    { t: 19.4, v: aimAt(finder) },
    { t: 22.1, v: L(phoneRig, -1.0, 0.45, 0) },
    { t: 24.5, v: L(phoneRig, -0.3, 0.5, 0) },
    { t: 27.3, v: L(endMark.mesh, 0, -0.95, 0) },
    { t: 30.0, v: L(endMark.mesh, 0, -0.95, 0) },
  ]);
  const roll = track([{ t: 0, v: 0.0 }, { t: 3.0, v: -0.01 }, { t: 4.35, v: 0.035 }, { t: 6.5, v: 0.0 }, { t: 9.3, v: -0.015 }, { t: 11, v: 0 }, { t: 22.1, v: 0.012 }, { t: 25, v: 0 }]);
  const fov = track([{ t: 0, v: 32 }, { t: 3.85, v: 36 }, { t: 4.35, v: 44 }, { t: 5.6, v: 34 }, { t: 9.3, v: 38 }, { t: 11, v: 36 }, { t: 24, v: 34 }, { t: 30, v: 32 }]);

  // What is in focus, by world point; the camera's distance to it is the focus distance.
  const focusPt = track([
    { t: 0, v: A(M) },
    { t: 3.0, v: A(M) },
    { t: 4.0, v: A(EYE) },
    { t: 4.9, v: A(BC) },
    { t: 5.7, v: A(BC) },
    { t: 6.5, v: A(tagFocus) },
    { t: 7.2, v: A(tagFocus) },
    { t: 7.95, v: A(BC) },
    { t: 8.8, v: A(BC) },
    { t: 10.4, v: L(home.group, 0, 0, 0) },
    { t: 12.6, v: L(home.group, 0, 0, 0) },
    { t: 14.8, v: L(shop.group, -0.6, 0, 0) },
    { t: 17.1, v: L(product.group, -0.6, 0, 0) },
    { t: 19.4, v: L(finder.group, -0.6, 0, 0) },
    { t: 22.1, v: A(PH) },
    { t: 24.5, v: A(PH) },
    { t: 27.3, v: A(END) },
  ]);
  // Aperture in pixels of blur at infinity: shallow on the objects, deeper on the pages so they read.
  const aperture = track([{ t: 0, v: 10 }, { t: 3.6, v: 12 }, { t: 4.9, v: 20 }, { t: 6.5, v: 15 }, { t: 7.2, v: 15 }, { t: 8.2, v: 20 }, { t: 8.8, v: 20 }, { t: 10.6, v: 9 }, { t: 19.5, v: 9 }, { t: 21.6, v: 16 }, { t: 25, v: 16 }, { t: 27, v: 12 }]);

  // ── HUD. ────────────────────────────────────────────────────────────────────────
  const title = titleCard(hud, brand, { line: "E-commerce storefront", meta: "Design direction and development, from first screen to checkout", top: 760 });
  const caps = {
    home: caption(hud, { index: "01", title: "Home", body: "Every landing sells on its first screen." }),
    shop: caption(hud, { index: "02", title: "Shop", body: "42 scents in three lines and six families, filtered in the URL." }),
    product: caption(hud, { index: "03", title: "Product", body: "Notes, wear and the original each scent was inspired by." }),
    finder: caption(hud, { index: "04", title: "Scent finder", body: "Five questions, three matches, straight to the bag." }),
    mobile: caption(hud, { index: "05", title: "Mobile first", body: "Built for the visitor arriving from Instagram, on a phone." }),
  };
  const end = endCard(hud, brand, { line: "E-commerce storefront", meta: "Design direction and development", stack: "Next.js · Shopify Storefront API · Vercel", url: "MYETERNAL.NET", top: 560 });

  // ── Pose. ───────────────────────────────────────────────────────────────────────
  const upVec = V(0, 1, 0);
  // slice: the length of shutter one sub-frame stands for (0 for a single-sample still).
  function pose(t, slice = 0) {
    // Camera, with a slow hand-held breath that settles while the camera flies.
    const p = pos(t), q = aim(t);
    const breath = 1 - envelope(t, 3.5, 5.0, 0.3, 0.4);
    camera.position.set(p[0] + drift(t, 1, 0.025) * breath, p[1] + drift(t, 2, 0.018) * breath, p[2] + drift(t, 3, 0.02) * breath);
    camera.up.copy(upVec);
    camera.lookAt(q[0], q[1], q[2]);
    camera.rotateZ(roll(t));
    camera.fov = fov(t);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const fp = focusPt(t);
    const focus = camera.position.distanceTo(V(fp[0], fp[1], fp[2]));
    const ap = aperture(t);

    // Sky and fog: black at the open, golden hour at the bottle, the sea's blue along the screens.
    const u = sky.mat.uniforms;
    u.warmAmt.value = lerp(0, 0.34, tween(t, 3.4, 2.2, ease.inOut)) * (1 - 0.8 * tween(t, 25.0, 2.5, ease.inOut));
    u.coolAmt.value = 0.45 * tween(t, 9.5, 3, ease.inOut) * (1 - tween(t, 24.6, 2.6, ease.inOut));
    u.lift.value = lerp(0.35, 1, tween(t, 3.6, 2, ease.inOut)) * (1 - 0.5 * tween(t, 25.0, 2.5, ease.inOut));

    // The mark: dark, found by a band of light, then the room's reflections come up.
    // The same band of light signs the end: it crosses the mark over the phones.
    const sw = tween(t, 0.25, 2.8, ease.inOut);
    const sw2 = tween(t, 25.9, 3.4, ease.emphasized);
    if (t < 15) {
      sweepLight.position.set(M.x - 4.2 + sw * 8.4, M.y + 1.6, M.z + 2.6);
      sweepLight.target.position.copy(M);
      sweepLight.intensity = 26 * envelope(t, 0.2, 4.4, 0.8, 0.6);
    } else {
      // It travels in from the left and comes to rest above the mark, as a key light.
      sweepLight.position.copy(endMark.mesh.localToWorld(V(-3.2 + sw2 * 3.9, 1.3, 2.4)));
      sweepLight.target.position.copy(END);
      sweepLight.intensity = 11 * tween(t, 25.8, 1.0);
    }
    sweepLight.target.updateMatrixWorld();
    mark.mesh.material.envMapIntensity = 0.06 + 0.9 * tween(t, 0.9, 2.4, ease.inOut);
    mark.mesh.rotation.y = lerp(-0.12, 0.06, tween(t, 0, 4.2, ease.inOut));
    animateText(houseLine, t, { inAt: 1.2, stagger: 0.025, dur: 0.9, rise: 0.03, blur: 6, outAt: 3.1, outDur: 0.4 });
    sweepText(houseLine, M.x - 2.6 + sw * 5.2, 0.45, 1.2);

    // The bottle: light finds it as the camera comes through.
    const lit = tween(t, 3.4, 1.6, ease.inOut);
    for (const m of Object.values(bottle.materials)) m.envMapIntensity = (m === bottle.materials.label ? 0.4 : m === bottle.materials.liquid ? 0.6 : 1.2) * lit;
    key.intensity = 14 * lit;
    rim.intensity = 22 * lit;
    fill.intensity = 1.2 * lit;
    plinth.mat.envMapIntensity = 0.5 * lit;
    bottle.group.rotation.y = 0.18 + lerp(0, 0.32, tween(t, 3.8, 6.5, ease.inOut));
    shafts.group.children.forEach((m) => {
      const b = m.userData.base;
      m.material.opacity = b.o * lit * (1 - tween(t, 10.5, 2)) * (0.75 + 0.25 * Math.sin(t * 0.7 + b.ph));
      m.position.x = b.x + Math.sin(t * 0.13 + b.ph) * 0.2;
    });
    animateText(tagline, t, { inAt: 5.3, stagger: 0.1, dur: 1.2, rise: 0.16, depth: 0.5, blur: 9, outAt: 7.75, outDur: 0.6, outStagger: 0.03 });
    sweepText(tagline, lerp(0.5, 5.5, tween(t, 6.3, 1.9, ease.inOut)), 0.6, 0.45 * envelope(t, 6.3, 8.3, 0.5, 0.5));

    // Screens: each powers on as the camera turns to it; the home page scrolls like a reader.
    const on = { home: 9.6, shop: 13.3, product: 15.7, finder: 18.0 };
    const scr = { home, shop, product, finder };
    for (const [name, s] of Object.entries(scr)) {
      const r = tween(t, on[name], 1.0, ease.inOut);
      s.mat.uniforms.reveal.value = r;
      s.mat.uniforms.opacity.value = 1;
      const f = clamp(r * 2.5);
      s.barMat.opacity = f;
      s.frameMat.opacity = f;
      s.frameMat.envMapIntensity = 0.7 * f;
      s.group.visible = r > 0.001;
      s.mat.uniforms.sweepAmt.value = envelope(t, on[name] + 0.6, on[name] + 2.4, 0.4, 0.8);
      s.mat.uniforms.sweepX.value = lerp(-0.2, 1.2, tween(t, on[name] + 0.6, 1.8, ease.inOut));
    }
    // Home: hold on the first screen, then down to the three lines and where to start.
    // Each scroll is a function of time; its speed times the sub-frame's slice of the shutter is the smear.
    const smearOf = (f) => (f(t + 0.002) - f(t - 0.002)) / 0.004 * slice;
    // Home: the first screen, then the three lines (held, they are the house), then where to start.
    const homeScroll = (x) => lerp(0, 900, tween(x, 10.7, 1.0, ease.sine)) + lerp(0, 1110, tween(x, 12.4, 1.2, ease.sine));
    scrollTo(home.mat, home.meta, homeScroll(t), 900, smearOf(homeScroll));

    // Phones: rise into place, float, and scroll.
    const ph0 = 20.9;
    phoneRig.visible = t > ph0 - 0.1;
    phones.forEach((ph, i) => {
      const r = tween(t, ph0 + i * 0.18, 1.6, ease.emphasized);
      const g = ph.p.group;
      g.position.set(ph.at.x, ph.at.y - (1 - r) * 0.9 + Math.sin(t * 0.8 + i * 1.7) * 0.03, ph.at.z);
      g.rotation.set(Math.sin(t * 0.6 + i) * 0.02, ph.ry + (1 - r) * 0.5 * (i - 1) + Math.sin(t * 0.5 + i * 2.1) * 0.03, ph.rz);
      // Each phone fades up with its screen already lit: no dark slabs rising out of the dark.
      const f = tween(t, ph0 + 0.15 + i * 0.18, 0.9, ease.inOut);
      ph.p.mat.uniforms.reveal.value = tween(t, ph0 - 0.1 + i * 0.18, 0.8, ease.inOut);
      ph.p.mat.uniforms.opacity.value = f;
      ph.p.bodyMat.opacity = f;
      ph.p.glassMat.opacity = f;
      ph.p.bodyMat.envMapIntensity = r;
    });
    const phoneHome = (x) => lerp(0, 875, tween(x, 22.3, 1.5, ease.sine));
    const phonePdp = (x) => lerp(0, 520, tween(x, 22.9, 1.3, ease.sine));
    scrollTo(phones[1].p.mat, phones[1].p.meta, phoneHome(t), 844, smearOf(phoneHome));
    scrollTo(phones[0].p.mat, phones[0].p.meta, phonePdp(t), 844, smearOf(phonePdp));
    animateText(mobileWord, t, { inAt: 21.2, stagger: 0.09, dur: 1.2, rise: 0.2, depth: 0.5, blur: 10, outAt: 25.0, outDur: 0.7 });

    // End: the mark returns, lit by a last pass of light.
    const e = tween(t, 25.6, 2.2, ease.inOut);
    endMark.mesh.material.envMapIntensity = 0.05 + 0.85 * e;
    endMark.mesh.visible = t > 23;
    endMark.mesh.rotation.y = ROW_Y + lerp(-0.3, 0.04, tween(t, 25.4, 4.6, ease.inOut));

    // Motes.
    const dustAmt = [envelope(t, 3.8, 11.5, 1.5, 1.5), envelope(t, 9.6, 21.5, 1.5, 1.5), envelope(t, 20.4, 27.5, 1.2, 1.5)];
    dust.forEach((d, i) => {
      const du = d.mat.uniforms;
      du.time.value = t;
      du.focus.value = focus;
      du.aperture.value = ap;
      du.maxCoc.value = 14;
      du.amount.value = dustAmt[i] * 0.9;
      d.points.visible = dustAmt[i] > 0.001;
    });

    scene.fog.density = lerp(0.045, 0.028, tween(t, 3.5, 3, ease.inOut));

    const look = {
      exposure: lerp(1.0, 1.06, tween(t, 9.6, 2)),
      bloom: 0.32,
      bloomThreshold: 1.0,
      vignette: 0.6,
      grain: 0.03,
      ca: 0.0022,
      fade: 1 - tween(t, 0.0, 0.9, ease.inOut),
      fadeColor: 0x000000,
    };
    return { scene, overlay, camera, focus, aperture: ap, maxCoc: 14, look, clear: 0x000000 };
  }

  function hudPose(t) {
    title.pose(t, 7.95, 9.75);
    caps.home.pose(t, 10.4, 13.3);
    caps.shop.pose(t, 14.05, 16.0);
    caps.product.pose(t, 16.35, 18.3);
    caps.finder.pose(t, 18.65, 20.7);
    caps.mobile.pose(t, 21.75, 24.9);
    end.pose(t, 26.4);
  }

  const label = (t) => [...BEATS].reverse().find(([, s]) => t >= s)?.[0] ?? "";
  // The flight through the mark's eye moves a few hundred pixels a frame: more sub-frames
  // there, so its motion blur is a smear and not a row of copies.
  const samples = (t, base) => (base <= 1 ? base : t >= 3.9 && t <= 4.35 ? Math.max(base, 16) : t >= 3.7 && t <= 4.6 ? Math.max(base, 10) : base);
  return { pose, hud: hudPose, label, samples };
}
