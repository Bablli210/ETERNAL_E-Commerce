import "server-only";
import { cache } from "react";
import snapshotJson from "@/content/catalogue.snapshot.json";
import { scents as editorial, type NoteStage } from "@/content/scents";
import { families, familyOrder, moods, moodOrder, lines, collectionBySlug, type CollectionDef, type FamilyKey, type LineKey, type MoodKey } from "@/content/taxonomy";
import { taleForHandle } from "@/content/tales";
import { shopifyConfigured } from "./shopify/client";
import { fetchAllProducts, fetchBestsellingHandles } from "./shopify/queries";
import type { CatalogueSnapshot, Money, ShopifyImage, ShopifyProduct } from "./shopify/types";
import { numericId } from "./format";

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
  isBestseller: boolean;
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

const getBestsellingOrder = cache(async (live: boolean): Promise<string[] | null> => {
  if (!live) return null;
  try {
    return await fetchBestsellingHandles(12);
  } catch {
    return null;
  }
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

const STOP = new Set(["a", "an", "the", "of", "on", "over", "with", "and", "into", "onto", "base", "notes", "note", "accord", "eau", "de", "parfum", "ml", "then", "resting", "open", "opening", "closing", "settling", "resolving", "lift", "fold", "melt", "luminous", "sparkling", "soft", "white", "dry", "sharp", "aromatic", "signature", "fresh", "woody", "sweet", "elusive", "whisper-warm", "powdery", "same", "every", "boat", "comes", "home"]);

/** Three notes for a card when no metafield or editorial list exists. */
const notesFromDescription = (description: string): string[] => {
  const cleaned = description
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[—:.;]/g, ",")
    .replace(/\b(resting on|base of|over|with|and|onto|into|open|opening|closing|settling on|resolving to|lift into|melt into|fold into)\b/g, ",");
  const parts = cleaned.split(",").map((s) => s.trim()).filter((s) => s && !STOP.has(s) && s.split(" ").length <= 3 && !/\d/.test(s));
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

function enrich(p: ShopifyProduct, bestselling: string[] | null): Scent {
  const ed = editorial[p.handle] ?? {};
  const tags = p.tags.map((t) => t.toLowerCase());
  const kind: Scent["kind"] = p.handle === "mystery-box" || p.handle === "discovery-set" ? "set" : "scent";

  const lineMeta = meta(p, "line")?.toLowerCase() as LineKey | undefined;
  const line = (lineMeta && lines[lineMeta] ? lineMeta : null) ?? ed.line ?? lineFromTags(tags);

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

  const variants: Variant[] = p.variants.map((v) => {
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
  const bottle = variants.find((v) => v.kind === "bottle") ?? variants.find((v) => v.kind === "set") ?? variants[0] ?? null;
  const sample = variants.find((v) => v.kind === "sample") ?? null;

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

  const isBestseller = bestselling ? bestselling.includes(p.handle) : Boolean(ed.bestseller);
  const lowStockQty = bottle?.quantityAvailable;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    tags,
    createdAt: p.createdAt,
    availableForSale: p.availableForSale && variants.some((v) => v.availableForSale),
    images: p.images,
    image: p.images[0] ?? null,
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
    inspiredBy: meta(p, "inspired_by") ?? ed.inspiredBy ?? null,
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
    isNew: Date.parse(p.createdAt) >= NEW_SINCE && kind === "scent",
    lowStock: typeof lowStockQty === "number" && lowStockQty > 0 && lowStockQty <= 5 ? lowStockQty : null,
  };
}

export const getCatalogue = cache(async (): Promise<{ all: Scent[]; scents: Scent[]; live: boolean }> => {
  const { products, live } = await getRawProducts();
  const bestselling = await getBestsellingOrder(live);
  const all = products.map((p) => enrich(p, bestselling)).sort((a, b) => a.title.localeCompare(b.title));
  return { all, scents: all.filter((s) => s.kind === "scent"), live };
});

export async function getScent(handle: string): Promise<Scent | null> {
  const { all } = await getCatalogue();
  return all.find((s) => s.handle === handle) ?? null;
}

export async function getBestsellers(limit = 8): Promise<Scent[]> {
  const { scents, live } = await getCatalogue();
  const order = await getBestsellingOrder(live);
  const picked = scents.filter((s) => s.isBestseller);
  const sorted = order ? [...picked].sort((a, b) => order.indexOf(a.handle) - order.indexOf(b.handle)) : picked;
  if (sorted.length >= limit) return sorted.slice(0, limit);
  const rest = scents.filter((s) => !s.isBestseller && s.image);
  return [...sorted, ...rest].slice(0, limit);
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
  }
  // Products with imagery first, so the first rows always show a bottle.
  const withImage = picked.filter((s) => s.image), without = picked.filter((s) => !s.image);
  return { def, scents: [...withImage, ...without] };
}

export async function getRelated(scent: Scent, limit = 4): Promise<Scent[]> {
  const { scents } = await getCatalogue();
  const byHandle = new Map(scents.map((s) => [s.handle, s]));
  const picked: Scent[] = scent.alsoTry.map((h) => byHandle.get(h)).filter((s): s is Scent => Boolean(s));
  const pool = scents
    .filter((s) => s.handle !== scent.handle && !picked.includes(s) && s.image)
    .map((s) => ({ s, score: (s.line === scent.line ? 2 : 0) + s.families.filter((f) => scent.families.includes(f)).length }))
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

/** Slim, serialisable index for the client-side search overlay and finder. */
export type ScentIndexEntry = {
  handle: string;
  title: string;
  line: LineKey | null;
  lineLabel: string | null;
  inspiredBy: string | null;
  notesShort: string[];
  tags: string[];
  families: FamilyKey[];
  price: Money;
  image: string | null;
  hoverImage: string | null;
  world: World;
  kind: Scent["kind"];
  isBestseller: boolean;
  isNew: boolean;
  bottle: Pick<Variant, "id" | "numericId" | "label" | "price" | "availableForSale"> | null;
  sample: Pick<Variant, "id" | "numericId" | "label" | "price" | "availableForSale"> | null;
};

export const toIndexEntry = (s: Scent): ScentIndexEntry => ({
  handle: s.handle,
  title: s.title,
  line: s.line,
  lineLabel: s.lineLabel,
  inspiredBy: s.inspiredBy,
  notesShort: s.notesShort,
  tags: s.tags,
  families: s.families,
  price: s.price,
  image: s.image?.url ?? null,
  hoverImage: s.images[1]?.url ?? null,
  world: s.world,
  kind: s.kind,
  isBestseller: s.isBestseller,
  isNew: s.isNew,
  bottle: s.bottle ? { id: s.bottle.id, numericId: s.bottle.numericId, label: s.bottle.label, price: s.bottle.price, availableForSale: s.bottle.availableForSale } : null,
  sample: s.sample ? { id: s.sample.id, numericId: s.sample.numericId, label: s.sample.label, price: s.sample.price, availableForSale: s.sample.availableForSale } : null,
});

export async function getScentIndex(): Promise<ScentIndexEntry[]> {
  const { all } = await getCatalogue();
  return all.map(toIndexEntry);
}
