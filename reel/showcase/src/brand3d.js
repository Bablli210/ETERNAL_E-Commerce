// The house's objects in three dimensions: the e∞ mark and the logotypes extruded
// from the storefront's own paths (assets/brand.json, read from components/ui),
// and the bottle, modelled from the packshots: a short clear cylinder with a heavy
// base, a black dome cap and a cream wrap label.
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { FACES } from "./type3d.js";
import { rng } from "./ease.js";

/** Extrude an SVG path (even-odd fill, y down) into a centred solid facing +z, `width` world units wide. */
export function extrude(d, { width, depth = 0.08, bevel = 0.012, segments = 24 } = {}) {
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#000" fill-rule="evenodd"/></svg>`);
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const probe = new THREE.ShapeGeometry(shapes);
  probe.computeBoundingBox();
  const bb = probe.boundingBox;
  const unit = width / (bb.max.x - bb.min.x);
  probe.dispose();
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: depth / unit, bevelEnabled: true, bevelThickness: bevel / unit, bevelSize: (bevel * 0.7) / unit, bevelSegments: 4, curveSegments: segments,
  });
  // Turn it right way up (SVG y runs down) without mirroring it: a half turn about x.
  geo.rotateX(Math.PI);
  geo.scale(unit, unit, unit);
  geo.computeBoundingBox();
  const c = new THREE.Vector3();
  geo.boundingBox.getCenter(c);
  geo.translate(-c.x, -c.y, -c.z);
  geo.computeVertexNormals();
  return { geo, unit, svgBox: bb };
}

export function goldMaterial() {
  return new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#d8a463"), metalness: 1, roughness: 0.26, clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 1 });
}

/** The e∞ mark: returns { mesh, eyes } where eyes are the two counters' centres in the mesh's local space. */
export function makeMark(brand, width) {
  const { geo, unit, svgBox } = extrude(brand.mark.fill, { width, depth: width * 0.045, bevel: width * 0.008, segments: 40 });
  const mesh = new THREE.Mesh(geo, goldMaterial());
  const cx = (svgBox.min.x + svgBox.max.x) / 2, cy = (svgBox.min.y + svgBox.max.y) / 2;
  // The counters' centroids, from the traced path's two inner subpaths (components/ui/mark-path.ts).
  const local = (x, y) => new THREE.Vector3((x - cx) * unit, -(y - cy) * unit, 0);
  return { mesh, eyes: { left: local(19.8, 17.0), right: local(100.7, 50.3) } };
}

/** A canvas texture of the label: mark, line logotype, scent name, as on the real bottles. */
function labelTexture(brand, { line, name, ink, logoInk }) {
  const W = 2048, H = 1170;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, "#f1ebde");
  grd.addColorStop(1, "#e8e0cf");
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // Paper tooth.
  const r = rng(7);
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "120,100,70"},${0.035 + r() * 0.04})`;
    g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  const centred = (d, box, w, y, color) => {
    const s = w / box.w;
    g.save();
    g.translate(W / 2 - w / 2, y);
    g.scale(s, s);
    g.fillStyle = color;
    g.fill(new Path2D(d), "evenodd");
    g.restore();
  };
  const [, , mw, mh] = brand.mark.viewBox.split(" ").map(Number);
  centred(brand.mark.fill, { w: mw, h: mh }, 112, 118, logoInk);
  const lb = brand.boxes[line];
  centred(brand.logos[line], lb, 640, 228, logoInk);
  const text = (str, face, px, y, color, tracking = 0) => {
    const f = FACES[face];
    g.font = `${f.style} ${f.weight} ${px}px ${f.family}`;
    g.letterSpacing = `${tracking * px}px`;
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillText(str, W / 2, y);
  };
  text("A PERFUME HOUSE FROM CAIRO", "sub", 22, 228 + (640 / lb.w) * lb.h + 54, logoInk, 0.22);
  text(name, "serif", 142, 790, ink, -0.01);
  text("EAU DE PARFUM", "sans", 40, 905, ink, 0.1);
  text("55 ML / 1.8 FL OZ", "sans", 34, 960, ink, 0.08);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** A soft round shadow, for where the bottle meets the stone. */
function blobTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.85)");
  grd.addColorStop(0.45, "rgba(0,0,0,0.5)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/**
 * The bottle, base at the origin. Body 1.0 wide and 0.78 tall, cap 0.6 wide: the
 * proportions of the 55 ml bottle in the packshots. Returns { group, materials, height }.
 */
export function makeBottle(brand, { line = "eterna", name = "vintage vanilla", liquid = "#e7c98f" } = {}) {
  const group = new THREE.Group();
  const R = 0.5, H = 0.78, rr = 0.085;
  const arc = (pts, cx, cy, r, a0, a1, n = 10) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } };

  // Glass: a solid of revolution, the base heavy as on the real bottle.
  const outer = [new THREE.Vector2(0, 0)];
  arc(outer, R - rr, rr, rr, -Math.PI / 2, 0);
  arc(outer, R - rr, H - rr, rr, 0, Math.PI / 2);
  outer.push(new THREE.Vector2(0.2, H), new THREE.Vector2(0.2, H + 0.03), new THREE.Vector2(0, H + 0.03));
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.4, ior: 1.47,
    attenuationColor: new THREE.Color("#efe3c8"), attenuationDistance: 3, specularIntensity: 1,
    envMapIntensity: 1.0, depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(outer, 128), glassMat);
  glass.renderOrder = 2;
  group.add(glass);

  // The juice, seen through the glass; drawn after it.
  const inner = [new THREE.Vector2(0, 0.17)];
  arc(inner, R - 0.065 - 0.05, 0.17 + 0.05, 0.05, -Math.PI / 2, 0, 6);
  arc(inner, R - 0.065 - 0.02, 0.66 - 0.02, 0.02, 0, Math.PI / 2, 4);
  inner.push(new THREE.Vector2(0, 0.66));
  const liquidMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(liquid), roughness: 0.08, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 0.6 });
  const juice = new THREE.Mesh(new THREE.LatheGeometry(inner, 96), liquidMat);
  juice.renderOrder = 3;
  group.add(juice);

  // Depth for the glass, written last: keeps the depth of field honest about where the bottle is.
  const depthOnly = new THREE.Mesh(glass.geometry, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, depthWrite: true }));
  depthOnly.renderOrder = 999;
  group.add(depthOnly);

  // The cap: a short black cylinder under a dome, gloss lacquer.
  const capPts = [new THREE.Vector2(0, H + 0.005), new THREE.Vector2(0.285, H + 0.005)];
  arc(capPts, 0.285, H + 0.025, 0.02, -Math.PI / 2, 0, 4);
  capPts.push(new THREE.Vector2(0.305, H + 0.2));
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * (Math.PI / 2); capPts.push(new THREE.Vector2(Math.cos(a) * 0.305, H + 0.2 + Math.sin(a) * 0.29)); }
  const capMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#0c0b0b"), roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 128), capMat);
  group.add(cap);

  // The label: a cream wrap across the front, 112° of the body.
  const span = THREE.MathUtils.degToRad(112);
  const labelH = 0.56;
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: labelTexture(brand, { line, name, ink: "#2c2925", logoInk: line === "eterna" ? "#8ea5ba" : "#2c2925" }),
    roughness: 0.62, metalness: 0, envMapIntensity: 0.7,
    // Drawn in the transparent pass, so the glass's refraction (which samples opaque
    // things) shows the stone and the dark behind the bottle, not its own label.
    transparent: true,
  });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.003, R + 0.003, labelH, 96, 1, true, -span / 2, span), labelMat);
  label.renderOrder = 4;
  label.position.y = 0.12 + labelH / 2 + 0.005;
  group.add(label);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.9 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.renderOrder = 1;
  group.add(shadow);

  return { group, materials: { glass: glassMat, liquid: liquidMat, cap: capMat, label: labelMat }, shadow, height: H + 0.49 };
}

/** A stone column for the bottle to stand on; its top is at y = 0. */
export function makePlinth(texture, radius = 1.15, height = 6) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#7a6c5c"), map: texture, roughness: 0.78, metalness: 0, bumpMap: texture, bumpScale: 0.6, envMapIntensity: 0.5 });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 128, 1), mat);
  mesh.position.y = -height / 2;
  return { mesh, mat };
}
