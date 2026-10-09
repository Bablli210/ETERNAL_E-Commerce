// Boots the showcase and exposes window.__film for the preview and render tools:
//   await __film.seek(seconds, { samples })   // paint that exact moment
//   __film.duration, __film.fps
// URL params: ?samples=N (sub-frames per frame, default 1 here; the render tool sets
// its own), ?t=<s> paints that moment on load, ?debug shows the timecode.
import * as THREE from "three";
import { createPipeline } from "./pipeline.js";
import { createFilm, FPS, DURATION } from "./film.js";

const params = new URLSearchParams(location.search);
const W = 1920, H = 1080;

async function loadTexture(url) {
  const tex = await new THREE.TextureLoader().loadAsync(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

async function boot() {
  // The faces first: every 3D word is drawn into a canvas once, at build time.
  const faces = ["400 100px 'The Seasons'", "italic 400 100px 'The Seasons Italic'", "400 100px 'Cabinet Grotesk'", "400 100px 'General Sans'", "600 100px 'Cormorant Garamond'"];
  await Promise.all(faces.map((f) => document.fonts.load(f, "AaBb09,.")));
  await document.fonts.ready;
  for (const f of faces.slice(0, 4)) if (!document.fonts.check(f, "Aa")) throw new Error(`font did not load: ${f}`);

  const brand = await (await fetch("assets/brand.json")).json();
  const texMeta = await (await fetch("assets/tex/manifest.json")).json();
  const pages = {};
  await Promise.all(Object.entries(texMeta).map(async ([name, meta]) => {
    const texture = await loadTexture(`assets/tex/${name}.jpg`);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    pages[name] = { texture, meta };
  }));
  const photos = {};
  for (const name of ["texture-wet-stone", "texture-plaster"]) photos[name] = await loadTexture(`../../public/images/${name}.jpg`);

  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  if ("transmissionResolutionScale" in renderer) renderer.transmissionResolutionScale = 0.5;

  const film = await createFilm({ renderer, brand, pages, photos, hud: document.getElementById("hud"), W, H });
  const pipeline = createPipeline(renderer, W, H);

  // Upload every texture and compile every shader before the first frame.
  const warm = film.pose(0);
  renderer.compile(warm.scene, warm.camera);
  if (warm.overlay) renderer.compile(warm.overlay, warm.camera);
  warm.scene.traverse((o) => { const m = o.material; if (m) for (const v of Object.values(m.uniforms ?? {})) if (v?.value?.isTexture) renderer.initTexture(v.value); if (m?.map) renderer.initTexture(m.map); });

  let dbg = null;
  if (params.has("debug")) { dbg = document.createElement("div"); dbg.id = "debug"; document.getElementById("stage").append(dbg); }
  const defaultSamples = Number(params.get("samples") ?? 1);

  const px = new Uint8Array(4);
  async function seek(t, { samples = defaultSamples } = {}) {
    const frame = Math.round(t * FPS);
    const n = film.samples(t, samples);
    const slice = n > 1 ? 0.5 / FPS / n : 0;
    pipeline.frame(t, FPS, n, (st) => film.pose(st, slice), frame);
    film.hud(t);
    if (dbg) dbg.textContent = `${t.toFixed(3)}s  f${frame}  ${film.label(t)}`;
    // A one-pixel read waits for the GPU to finish the frame (finish() alone does not on SwiftShader).
    const gl = renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  await seek(Number(params.get("t") ?? 0));
  // The camera at time t, without painting: for checking the path's speed and smoothness.
  const probe = (t, slice = 0) => {
    const { camera, scene } = film.pose(t, slice);
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    const smear = [];
    scene.traverse((o) => { const u = o.material?.uniforms?.smear; if (u?.value) smear.push(u.value); });
    return { p: camera.position.toArray(), d: d.toArray(), fov: camera.fov, smear };
  };
  window.__film = { fps: FPS, duration: DURATION, seek, probe, label: film.label, times: pipeline.times };
}

boot().catch((err) => {
  document.title = `ERROR: ${err.message}`;
  window.__filmError = err.message;
  console.error(err);
});
