import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * The house's display face, The Seasons, replaces Cormorant as soon as it is
 * available, by either route:
 *
 * - Self-hosted: the licensed web-font files in public/fonts/the-seasons/,
 *   named for their weight and style, e.g. the-seasons-regular.woff2,
 *   the-seasons-bold.woff2, the-seasons-light-italic.woff2.
 * - Adobe Fonts: a web project containing The Seasons, its kit ID in
 *   NEXT_PUBLIC_ADOBE_FONTS_KIT (Adobe serves it as "the-seasons").
 *
 * Until then nothing loads and Cormorant stays; no request is made for a file
 * that is not there.
 */
const DIR = path.join(process.cwd(), "public", "fonts", "the-seasons");
const FORMATS: Record<string, string> = { ".woff2": "woff2", ".woff": "woff", ".otf": "opentype", ".ttf": "truetype" };
const WEIGHTS: [RegExp, number][] = [
  [/thin|hairline/, 100],
  [/extra-?light|ultra-?light/, 200],
  [/light/, 300],
  [/medium/, 500],
  [/semi-?bold|demi-?bold/, 600],
  [/extra-?bold|ultra-?bold/, 800],
  [/black|heavy/, 900],
  [/bold/, 700],
];

type Face = { src: string; format: string; weight: number; italic: boolean };

function scan(): Face[] {
  let names: string[];
  try {
    names = fs.readdirSync(DIR);
  } catch {
    return [];
  }
  const faces = new Map<string, Face>();
  for (const name of names) {
    const ext = path.extname(name).toLowerCase();
    if (!FORMATS[ext]) continue;
    const base = name.slice(0, -ext.length).toLowerCase();
    const weight = WEIGHTS.find(([re]) => re.test(base))?.[1] ?? 400;
    const italic = /italic|oblique/.test(base);
    const key = `${weight}-${italic}`;
    const face = { src: `/fonts/the-seasons/${name}`, format: FORMATS[ext], weight, italic };
    // One file per weight and style; woff2 wins over the heavier formats.
    const existing = faces.get(key);
    if (!existing || Object.values(FORMATS).indexOf(face.format) < Object.values(FORMATS).indexOf(existing.format)) faces.set(key, face);
  }
  return [...faces.values()].sort((a, b) => a.weight - b.weight || Number(a.italic) - Number(b.italic));
}

let cached: Face[] | null = null;
const faces = () => (process.env.NODE_ENV === "development" ? scan() : (cached ??= scan()));

const adobeKit = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT?.trim() || null;

export type BrandFont = {
  /** The family to put first in --font-serif. */
  family: string;
  /** @font-face rules for self-hosted files (empty with Adobe Fonts). */
  css: string;
  /** The upright regular file, preloaded so headings rarely fall back. */
  preload: string | null;
  /** Adobe's stylesheet, when the kit route is used. */
  stylesheet: string | null;
  /** True when an italic face exists, so the signature lines can use it too. */
  italic: boolean;
};

export function brandFont(): BrandFont | null {
  const local = faces();
  if (local.length) {
    const css = local
      .map((f) => `@font-face{font-family:"The Seasons";src:url("${f.src}") format("${f.format}");font-weight:${f.weight};font-style:${f.italic ? "italic" : "normal"};font-display:swap;}`)
      .join("");
    const regular = local.find((f) => !f.italic && f.weight === 400) ?? local.find((f) => !f.italic) ?? null;
    return { family: '"The Seasons"', css, preload: regular?.format === "woff2" ? regular.src : null, stylesheet: null, italic: local.some((f) => f.italic) };
  }
  if (adobeKit && /^[a-z0-9]+$/i.test(adobeKit)) {
    return { family: '"the-seasons"', css: "", preload: null, stylesheet: `https://use.typekit.net/${adobeKit}.css`, italic: true };
  }
  return null;
}
