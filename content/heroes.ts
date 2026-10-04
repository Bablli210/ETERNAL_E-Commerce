/**
 * The home page's first screen: one campaign still per visit. proxy.ts picks
 * one at random for every request to "/" and rewrites it to /home/<handle>,
 * a static page per still, so the choice costs no server render. An ad can
 * pin one with ?hero=<handle>, so its landing shows the bottle the ad showed.
 *
 * Images live in public/images: hero-<handle> (the wide still) and
 * hero-<handle>-mobile (the phone crop, 1.2:1, centred on the bottle).
 */
export type Hero = {
  /** The pictured scent's product handle. */
  handle: string;
  /** What the photograph shows, for screen readers. */
  alt: string;
};

export const heroes: Hero[] = [
  { handle: "vintage-vanilla", alt: "A bottle of Vintage Vanilla in a pool of vanilla custard, with vanilla pods and tonka beans" },
  { handle: "linen", alt: "A bottle of Linen on whipped cream, with iris, white blossom, black pepper and dried herbs" },
  { handle: "mango-eclipse", alt: "A bottle of Mango Eclipse in mango purée, with honeycomb, rose petals and jasmine" },
  { handle: "neroli-code", alt: "A bottle of Neroli Code on melted chocolate, with orange blossom and its leaves" },
  { handle: "raw-seduction", alt: "A bottle of Raw Seduction in amber syrup, with apple slices, cardamom, cedar and wood chips" },
];

export const heroByHandle = (handle: string | null | undefined): Hero | null => heroes.find((h) => h.handle === handle) ?? null;
