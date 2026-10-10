import "server-only";
import { cache } from "react";
import snapshotJson from "@/content/catalogue.snapshot.json";
import { scents as editorial, type NoteStage } from "@/content/scents";
import { families, familyOrder, moods, moodOrder, lines, collectionBySlug, type CollectionDef, type FamilyKey, type LineKey, type MoodKey } from "@/content/taxonomy";
import { taleForHandle } from "@/content/tales";
import { occasionOrder, occasions, type OccasionKey } from "@/content/occasions";
import { shopifyConfigured } from "./shopify/client";
import { fetchAllProducts } from "./shopify/queries";
import type { CatalogueSnapshot, Money, ShopifyImage, ShopifyProduct } from "./shopify/types";
import { numericId } from "./format";
import { siteImage } from "./site-images";

export type Variant = {
  id: string;
  numericId: string;
  title: string;
  label: string;
  sku: string | null;
  price: Money;
  availableForSale: boolean;
  quantityAvailable: number | null;
  kind: "bottle" | "sample" | "set" | "other";
};

export type World = { bg: string; accent: string; dark: boolean };

/** One of the mystery box's two choices, with the Shopify variant that sells it (null until Shopify has one). */
export type BoxChoice = { key: "him" | "her"; label: string; variant: Pick<Variant, "id" | "numericId" | "label" | "price" | "availableForSale"> | null };

/**
 * The mystery box comes for him or for her. Each choice sells through a box
 * variant whose title or option names it ("For him", "Male", "Men"…); a
 * choice with no such variant shows as out of stock, and so does the whole
 * box while neither choice can be bought.
 */
const BOX_CHOICES: { key: BoxChoice["key"]; label: string; match: RegExp }[] = [
  { key: "him", label: "For him", match: /\b(him|male|men|man)\b/i },
  { key: "her", label: "For her", match: /\b(her|female|women|woman)\b/i },
];

export type Scent = {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  availableForSale: boolean;
  images: ShopifyImage[];
  image: ShopifyImage | null;
  hoverImage: string | null;
  /** The notes sculpture (Shopify's, else products/<handle>-3): what a card shows first on a touch screen, which cannot hover to it. */
  notesImage: string | null;
  price: Money;
  variants: Variant[];
  bottle: Variant | null;
  sample: Variant | null;
  kind: "scent" | "set";
  line: LineKey | null;
  lineLabel: string | null;
  audience: string | null;
  families: FamilyKey[];
  moods: MoodKey[];
  world: World;
  inspiredBy: string | null;
  /** One of the Eternal Originals: the house's own composition, inspired by no other fragrance. */
  isOriginal: boolean;
  /** Shop by occasion (content/occasions.ts). */
  occasions: OccasionKey[];
  /** The mystery box's For him / For her choice; null on every other product. */
  choices: BoxChoice[] | null;
  comparison: string | null;
  signature: string | null;
  notesShort: string[];
  notes: NoteStage[] | null;
  story: string[] | null;
  taleSlug: string | null;
  longevity: number | null;
  sillage: number | null;
  wear: { time?: string; season?: string; occasion?: string; projection?: string } | null;
  alsoTry: string[];
  /** Earned from real sales only; see BESTSELLER_MIN_UNITS. */
  isBestseller: boolean;
  /** The house's own pick (`pick: true` in content/scents.ts): an order for "Where to start", never shown as a sales claim. */
  isPick: boolean;
  isNew: boolean;
  lowStock: number | null;
};

const snapshot = snapshotJson as CatalogueSnapshot;

/** Live products when the Storefront API is configured, else the committed snapshot. */
const getRawProducts = cache(async (): Promise<{ products: ShopifyProduct[]; live: boolean }> => {
  if (shopifyConfigured) {
    try {
      const products = await fetchAllProducts();
      if (products.length) return { products, live: true };
    } catch (err) {
      console.error("[catalogue] Storefront API failed, using snapshot:", err);
    }
  }
  return { products: snapshot.products, live: false };
});

const meta = (p: ShopifyProduct, key: string): string | null => {
  const m = p.metafields?.find((f) => f && f.key === key);
  return m?.value ?? null;
};

const metaList = (p: ShopifyProduct, key: string): string[] | null => {
  const v = meta(p, key);
  if (!v) return null;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain text */
  }
  return v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
};

const metaNumber = (p: ShopifyProduct, key: string): number | null => {
  const v = meta(p, key);
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/** Shopify rich text is JSON; pull its paragraphs out. Plain text splits on blank lines. */
const metaParagraphs = (p: ShopifyProduct, key: string): string[] | null => {
  const v = meta(p, key);
  if (!v) return null;
  try {
    const doc = JSON.parse(v) as { children?: { children?: { value?: string }[] }[] };
    const paras = (doc.children ?? []).map((n) => (n.children ?? []).map((c) => c.value ?? "").join("")).filter(Boolean);
    if (paras.length) return paras;
  } catch {
    /* plain text */
  }
  return v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
};

const isDark = (hex: string) => {
  const m = hex.replace("#", "");
  if (m.length !== 6) return false;
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
};

const lineFromTags = (tags: string[]): LineKey | null => {
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("eterna")) return "eterna";
  if (t.includes("eterno")) return "eterno";
  if (t.includes("eternal")) return "eternal";
  if (t.includes("for her")) return "eterna";
  if (t.includes("for him")) return "eterno";
  if (t.includes("unisex")) return "eternal";
  return null;
};

const STOP = new Set(["a", "an", "the", "of", "on", "over", "with", "and", "into", "onto", "base", "notes", "note", "accord", "eau", "de", "parfum", "ml", "then", "resting", "open", "opening", "closing", "settling", "resolving", "lift", "fold", "melt", "luminous", "sparkling", "soft", "white", "dry", "sharp", "aromatic", "signature", "fresh", "woody", "sweet", "elusive", "whisper-warm", "powdery", "same", "every", "boat", "comes", "home", "luminous floral"]);
/** Words that describe the whole scent rather than name a note. */
const DESCRIBES = /\b(duet|medley|trio|blend|signature)\b|&/;

/** Three notes for a card when no metafield or editorial list exists. */
const notesFromDescription = (description: string): string[] => {
  const cleaned = description
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[—:.;]/g, ",")
    .replace(/\b(resting on|base of|over|with|and|onto|into|open|opening|closing|settling on|resolving to|lift into|melt into|fold into)\b/g, ",");
  // "A luminous floral: bergamot…" describes the scent; only what follows is a note. So do "a soft floral duet" and "fresh & woody".
  const parts = cleaned.split(",").map((s) => s.trim().replace(/^(a|an|the) /, "")).filter((s) => s && !STOP.has(s) && !DESCRIBES.test(s) && s.split(" ").length <= 3 && !/\d/.test(s));
  const uniq: string[] = [];
  for (const p of parts) if (!uniq.includes(p)) uniq.push(p);
  return uniq.slice(0, 3).map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s));
};

const variantKind = (title: string, handle: string): Variant["kind"] => {
  const t = title.toLowerCase();
  if (handle === "mystery-box" || handle === "discovery-set" || /\d\s*[x×]\s*\d/.test(t)) return "set";
  if (/sample|\b(5|2|10)\s?ml\b/.test(t)) return "sample";
  if (t === "default title" || /\b(55|50|100)\s?ml\b/.test(t) || /bottle/.test(t)) return "bottle";
  return "other";
};

const NEW_SINCE = Date.parse("2026-08-15T00:00:00Z");

/**
 * "Bestseller" is earned from real orders only (playbook 5.6): at least this
 * many units in the last 30 days, read from the custom.units_sold_30d
 * metafield that a daily job writes from Shopify's sales. Until that feed
 * exists no scent carries the badge. A hand-set flag or Shopify's
 * BEST_SELLING sort, which ranks unsold products too, never earns it.
 */
const BESTSELLER_MIN_UNITS = 10;

/** What each local frame shows (public/images/products/<handle>, -2, -3, -4), for its alt text. */
const FRAME_ALT = ["bottle", "bottle in a scene", "among its notes", "in its box"];

/**
 * Which of those four frames a Shopify image is, or null when nothing says.
 * Its file name says first (<handle>, -2, -3 or -4, as the local files are
 * named, with or without the _suffix Shopify adds to a name it already has):
 * that is the same picture as the local file. Its alt text says next ("among
 * its notes", "in a scene", "in its box").
 */
function frameOf(handle: string, img: ShopifyImage): { frame: number; byName: boolean } | null {
  const file = img.url.split("?")[0].split("/").pop() ?? "";
  const named = file.match(new RegExp(`^${handle}(?:-([2-4]))?(?:_[\\w-]+)?\\.\\w+$`, "i"));
  if (named) return { frame: named[1] ? Number(named[1]) - 1 : 0, byName: true };
  const alt = img.altText ?? "";
  const frame = /\bnotes?\b/i.test(alt) ? 2 : /\bin a scene\b/i.test(alt) ? 1 : /\b(in its box|packaging)\b/i.test(alt) ? 3 : null;
  return frame === null ? null : { frame, byName: false };
}

function enrich(p: ShopifyProduct): Scent {
  const ed = editorial[p.handle] ?? {};
  const tags = p.tags.map((t) => t.toLowerCase());
  const kind: Scent["kind"] = p.handle === "mystery-box" || p.handle === "discovery-set" ? "set" : "scent";

  // The owner's sheet (content/scents.ts) settles the line first, then a line metafield, then the tags.
  const lineMeta = meta(p, "line")?.toLowerCase() as LineKey | undefined;
  const line = ed.line ?? (lineMeta && lines[lineMeta] ? lineMeta : null) ?? lineFromTags(tags);

  const familyMeta = metaList(p, "scent_family");
  const familyKeys = familyMeta
    ? familyOrder.filter((k) => familyMeta.some((f) => f.toLowerCase().replace(/\s*&\s*/, "-") === k || f.toLowerCase() === families[k].label.toLowerCase()))
    : familyOrder.filter((k) => families[k].tags.some((t) => tags.includes(t)));

  const moodMeta = metaList(p, "mood_words");
  const moodKeys = moodMeta
    ? moodOrder.filter((k) => moodMeta.some((m) => m.toLowerCase().replace(/\s+/g, "-") === k || m.toLowerCase() === moods[k].label.toLowerCase()))
    : moodOrder.filter((k) => moods[k].tags.some((t) => tags.includes(t)));

  const worldMeta = meta(p, "color_world");
  const world: World = worldMeta && /^#?[0-9a-f]{6}$/i.test(worldMeta)
    ? { bg: worldMeta.startsWith("#") ? worldMeta : `#${worldMeta}`, accent: isDark(worldMeta) ? "#F3EFE7" : "#171614", dark: isDark(worldMeta) }
    : ed.colorWorld
      ? { bg: ed.colorWorld.bg, accent: ed.colorWorld.accent, dark: ed.colorWorld.dark }
      : familyKeys[0]
        ? families[familyKeys[0]].world
        : line
          ? { bg: lines[line].tone, accent: lines[line].toneDark ? "#F3EFE7" : "#171614", dark: lines[line].toneDark }
          : { bg: "#E4D9C5", accent: "#171614", dark: false };

  let variants: Variant[] = p.variants.map((v) => {
    const k = variantKind(v.title, p.handle);
    const size = v.selectedOptions?.find((o) => /size/i.test(o.name))?.value;
    return {
      id: v.id,
      numericId: numericId(v.id),
      title: v.title,
      label: v.title === "Default Title" ? size ?? "55 ml" : v.title,
      sku: v.sku,
      price: v.price,
      availableForSale: v.availableForSale,
      quantityAvailable: v.quantityAvailable ?? null,
      kind: k,
    };
  });
  let choices: BoxChoice[] | null = null;
  if (p.handle === "mystery-box") {
    const named = (v: Variant, c: (typeof BOX_CHOICES)[number]) =>
      c.match.test(v.title) || Boolean(p.variants.find((x) => x.id === v.id)?.selectedOptions?.some((o) => c.match.test(o.value)));
    choices = BOX_CHOICES.map((c) => {
      const v = variants.find((x) => named(x, c));
      return { key: c.key, label: c.label, variant: v ? { id: v.id, numericId: v.numericId, label: c.label, price: v.price, availableForSale: v.availableForSale } : null };
    });
    // A box variant that names neither choice cannot be bought: the shopper has to choose.
    const chosen = new Set(choices.flatMap((c) => (c.variant ? [c.variant.id] : [])));
    variants = variants.map((v) => (chosen.has(v.id) ? v : { ...v, availableForSale: false }));
    const pickable = choices.find((c) => c.variant?.availableForSale)?.variant ?? choices.find((c) => c.variant)?.variant;
    if (pickable) variants = [...variants.filter((v) => v.id === pickable.id), ...variants.filter((v) => v.id !== pickable.id)];
  }
  const bottle = variants.find((v) => v.kind === "bottle") ?? variants.find((v) => v.kind === "set") ?? variants[0] ?? null;
  const sample = variants.find((v) => v.kind === "sample") ?? null;

  /*
   * Gallery frames, Shopify first, in frame order (bottle, scene, notes, box).
   * A Shopify image takes the frame it names (frameOf), wherever it sits in
   * the store's order, so the bottle stays the packshot when the notes still
   * is the store's first image; one that names none takes the first frame
   * still free. Any frame Shopify does not have is filled from
   * public/images/products/<handle>{,-2,-3,-4}, so imagery can be added to
   * the repository before it is uploaded to the store, and a picture that is
   * in both shows once.
   */
  const localFrames = [
    siteImage(`products/${p.handle}`),
    siteImage(`products/${p.handle}-2`),
    siteImage(`products/${p.handle}-3`),
    siteImage(`products/${p.handle}-4`),
  ];
  const frames: (ShopifyImage | null)[] = [null, null, null, null];
  const byName = [false, false, false, false];
  const unnamed: ShopifyImage[] = [];
  for (const img of p.images) {
    const f = frameOf(p.handle, img);
    if (f && !frames[f.frame]) {
      frames[f.frame] = img;
      byName[f.frame] = f.byName;
    }
    // The same file uploaded again shows once; any other second picture of a frame still shows.
    else if (!(f?.byName && byName[f.frame])) unnamed.push(img);
  }
  const notesFrame = frames[2]?.url ?? localFrames[2];
  for (const img of unnamed) {
    const free = frames.indexOf(null);
    if (free < 0) break;
    frames[free] = img;
  }
  const images: ShopifyImage[] = frames.flatMap((img, i) => {
    if (img) return [img];
    const local = localFrames[i];
    return local ? [{ url: local, altText: `${p.title} ${FRAME_ALT[i]}`, width: null, height: null }] : [];
  });
  // Cards cross-fade to the notes still on hover; never to the frame they already show.
  const hover = siteImage(`products/${p.handle}-hover`) ?? notesFrame ?? images[1]?.url ?? null;

  const notesShort = metaList(p, "notes_short") ?? ed.notesShort ?? notesFromDescription(p.description);

  const top = metaList(p, "top_notes"), heart = metaList(p, "heart_notes"), base = metaList(p, "base_notes");
  const copy = metaList(p, "notes_copy");
  const notes: NoteStage[] | null =
    top && heart && base
      ? [
          { stage: "Top", name: top.join(" & "), copy: copy?.[0] ?? "", art: `${top[0]} — ingredient still` },
          { stage: "Heart", name: heart.join(" & "), copy: copy?.[1] ?? "", art: `${heart[0]} — ingredient still` },
          { stage: "Base", name: base.join(" & "), copy: copy?.[2] ?? "", art: `${base[0]} — ingredient still` },
        ]
      : ed.notes ?? null;

  const tale = ed.tale ? taleForHandle(p.handle) : taleForHandle(p.handle);
  const story = metaParagraphs(p, "story") ?? (tale?.complete ? tale.paragraphs : null);

  const isBestseller = (metaNumber(p, "units_sold_30d") ?? 0) >= BESTSELLER_MIN_UNITS;
  const lowStockQty = bottle?.quantityAvailable;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    tags,
    createdAt: p.createdAt,
    availableForSale: p.availableForSale && variants.some((v) => v.availableForSale),
    images,
    image: images[0] ?? null,
    hoverImage: hover && hover !== images[0]?.url ? hover : null,
    notesImage: notesFrame ?? null,
    price: bottle?.price ?? p.priceRange.minVariantPrice,
    variants,
    bottle,
    sample,
    kind,
    line,
    lineLabel: line ? lines[line].label : null,
    audience: line ? lines[line].audience : null,
    families: familyKeys,
    moods: moodKeys,
    world,
    // The owner's approved sheet wins over the metafield; an original names none.
    inspiredBy: ed.original ? null : (ed.inspiredBy ?? meta(p, "inspired_by") ?? null),
    isOriginal: Boolean(ed.original),
    occasions: occasionOrder.filter((k) => occasions[k].handles.includes(p.handle)),
    choices,
    comparison: meta(p, "comparison_note") ?? ed.comparison ?? null,
    signature: meta(p, "signature_line") ?? ed.signature ?? tale?.signature ?? null,
    notesShort,
    notes,
    story,
    taleSlug: tale?.slug ?? null,
    longevity: metaNumber(p, "longevity") ?? ed.longevity ?? null,
    sillage: metaNumber(p, "sillage") ?? ed.sillage ?? null,
    wear:
      meta(p, "time_of_day") || meta(p, "season") || meta(p, "occasion")
        ? { time: meta(p, "time_of_day") ?? undefined, season: meta(p, "season") ?? undefined, occasion: meta(p, "occasion") ?? undefined }
        : ed.wear ?? null,
    alsoTry: ed.alsoTry ?? [],
    isBestseller,
    isPick: Boolean(ed.pick),
    isNew: Date.parse(p.createdAt) >= NEW_SINCE && kind === "scent",
    lowStock: typeof lowStockQty === "number" && lowStockQty > 0 && lowStockQty <= 5 ? lowStockQty : null,
  };
}

export const getCatalogue = cache(async (): Promise<{ all: Scent[]; scents: Scent[]; live: boolean }> => {
  const { products, live } = await getRawProducts();
  // A product the owner marked inactive (content/scents.ts) stays off the site, whatever Shopify says.
  const all = products
    .filter((p) => !editorial[p.handle]?.inactive)
    .map(enrich)
    .sort((a, b) => a.title.localeCompare(b.title));
  return { all, scents: all.filter((s) => s.kind === "scent"), live };
});

export async function getScent(handle: string): Promise<Scent | null> {
  const { all } = await getCatalogue();
  return all.find((s) => s.handle === handle) ?? null;
}

/**
 * The house's picks, for "Where to start", the menu and the search overlay:
 * scents that really sell first, then the editorial picks, never padded with
 * the rest of the catalogue. An order, not a claim: only `isBestseller` may
 * be labelled as selling.
 */
export async function getBestsellers(limit = 8): Promise<Scent[]> {
  const { scents } = await getCatalogue();
  return scents
    .filter((s) => s.isBestseller || s.isPick)
    .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller))
    .slice(0, limit);
}

const LINE_RANK: Record<LineKey, number> = { eterna: 0, eterno: 1, eternal: 2 };

/** The Eternal Originals, for her, for him, then unisex, as the owner's sheet lists them. */
export async function getOriginals(): Promise<Scent[]> {
  const { scents } = await getCatalogue();
  return scents.filter((s) => s.isOriginal).sort((a, b) => (a.line ? LINE_RANK[a.line] : 3) - (b.line ? LINE_RANK[b.line] : 3));
}

export async function getNewArrivals(limit = 12): Promise<Scent[]> {
  const { scents } = await getCatalogue();
  return [...scents].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).filter((s) => s.isNew).slice(0, limit);
}

export async function getCollection(slug: string): Promise<{ def: CollectionDef; scents: Scent[] } | null> {
  const def = collectionBySlug(slug);
  if (!def) return null;
  const { scents } = await getCatalogue();
  let picked: Scent[];
  switch (def.kind) {
    case "all":
      picked = scents;
      break;
    case "line":
      picked = scents.filter((s) => s.line === def.key);
      break;
    case "family":
      picked = scents.filter((s) => s.families.includes(def.key as FamilyKey));
      break;
    case "mood":
      picked = scents.filter((s) => s.moods.includes(def.key as MoodKey));
      break;
    case "bestsellers":
      picked = await getBestsellers(12);
      break;
    case "new":
      picked = await getNewArrivals(12);
      break;
    case "originals":
      picked = await getOriginals();
      break;
    case "occasion":
      picked = scents.filter((s) => s.occasions.includes(def.key as OccasionKey));
      break;
  }
  // Products with imagery first, so the first rows always show a bottle.
  const withImage = picked.filter((s) => s.image), without = picked.filter((s) => !s.image);
  return { def, scents: [...withImage, ...without] };
}

/**
 * Scents to suggest beside this one: its editorial "also try" first, then the
 * closest by line, family and mood. Real sellers and the house's picks break
 * ties, so a product with no line and no tags yet (a new arrival before it is
 * tagged) gets the house's picks instead of the first names in the alphabet.
 */
export async function getRelated(scent: Scent, limit = 4): Promise<Scent[]> {
  const { scents } = await getCatalogue();
  const byHandle = new Map(scents.map((s) => [s.handle, s]));
  const picked: Scent[] = scent.alsoTry.map((h) => byHandle.get(h)).filter((s): s is Scent => Boolean(s));
  const shared = <T>(a: T[], b: T[]) => a.filter((x) => b.includes(x)).length;
  const score = (s: Scent) =>
    (scent.line && s.line === scent.line ? 3 : 0) + 2 * shared(s.families, scent.families) + shared(s.moods, scent.moods) + (s.isBestseller ? 1 : 0) + (s.isPick ? 0.5 : 0);
  const pool = scents
    .filter((s) => s.handle !== scent.handle && !picked.includes(s) && s.image)
    .map((s) => ({ s, score: score(s) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
  return [...picked, ...pool].slice(0, limit);
}

/** The scent whose tale leads the home page. */
export async function getFeaturedScent(): Promise<Scent | null> {
  const { scents } = await getCatalogue();
  return scents.find((s) => editorial[s.handle]?.featured) ?? scents.find((s) => s.story) ?? scents[0] ?? null;
}

export async function getLineCounts(): Promise<Record<LineKey, number>> {
  const { scents } = await getCatalogue();
  return {
    eterna: scents.filter((s) => s.line === "eterna").length,
    eterno: scents.filter((s) => s.line === "eterno").length,
    eternal: scents.filter((s) => s.line === "eternal").length,
  };
}

/** Slim, serialisable index for the client-side search overlay, grids and finder. */
export type ScentIndexEntry = {
  /** Shopify product id, numeric. */
  productId: string;
  handle: string;
  title: string;
  line: LineKey | null;
  lineLabel: string | null;
  inspiredBy: string | null;
  isOriginal: boolean;
  choices: BoxChoice[] | null;
  notesShort: string[];
  tags: string[];
  families: FamilyKey[];
  moods: MoodKey[];
  /** 1–10, where Shopify or content/scents.ts sets it: the finder's strength question reads it. */
  sillage: number | null;
  price: Money;
  image: string | null;
  hoverImage: string | null;
  notesImage: string | null;
  world: World;
  kind: Scent["kind"];
  isBestseller: boolean;
  isPick: boolean;
  isNew: boolean;
  bottle: Pick<Variant, "id" | "numericId" | "label" | "price" | "availableForSale"> | null;
  sample: Pick<Variant, "id" | "numericId" | "label" | "price" | "availableForSale"> | null;
};

export const toIndexEntry = (s: Scent): ScentIndexEntry => ({
  productId: numericId(s.id),
  handle: s.handle,
  title: s.title,
  line: s.line,
  lineLabel: s.lineLabel,
  inspiredBy: s.inspiredBy,
  isOriginal: s.isOriginal,
  choices: s.choices,
  notesShort: s.notesShort,
  tags: s.tags,
  families: s.families,
  moods: s.moods,
  sillage: s.sillage,
  price: s.price,
  image: s.image?.url ?? null,
  hoverImage: s.hoverImage,
  notesImage: s.notesImage,
  world: s.world,
  kind: s.kind,
  isBestseller: s.isBestseller,
  isPick: s.isPick,
  isNew: s.isNew,
  bottle: s.bottle ? { id: s.bottle.id, numericId: s.bottle.numericId, label: s.bottle.label, price: s.bottle.price, availableForSale: s.bottle.availableForSale } : null,
  sample: s.sample ? { id: s.sample.id, numericId: s.sample.numericId, label: s.sample.label, price: s.sample.price, availableForSale: s.sample.availableForSale } : null,
});

/**
 * One array per request: the layout hands it to the header and the bag, and a
 * page that passes the same array to its own client components (the product
 * page's Recently viewed, a collection's search) is serialised once, not twice.
 */
export const getScentIndex = cache(async (): Promise<ScentIndexEntry[]> => {
  const { all } = await getCatalogue();
  return all.map(toIndexEntry);
});
