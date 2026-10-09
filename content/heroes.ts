/**
 * The home page's first screen. proxy.ts rewrites every request for "/" to
 * /home/<handle>, a static page per hero, so the choice costs no server
 * render: the hero film (the first entry) unless an ad pins a campaign still
 * with ?hero=<handle>, so its landing shows the bottle the ad showed.
 *
 * A still lives in public/images: hero-<handle> (the wide still) and
 * hero-<handle>-mobile (the phone crop, 1.2:1, centred on the bottle). The
 * film is the `film` slot (public/videos/README.md): <film> from 1024 px and
 * <film>-mobile on a phone, each with its poster and its intro.
 */
export type Hero = {
  /** The pictured scent's product handle. */
  handle: string;
  /** The band the photograph fades into on a phone, and the colour behind it while it loads. */
  bg: string;
  /** What the photograph (the film's poster) shows, for screen readers. */
  alt: string;
  /** The film slot that plays in place of a still. */
  film?: string;
};

export const heroes: Hero[] = [
  // Hyper Motion: Divina's bottle rises into a blue sky, then the film moves through Enzo 1898 and Shadow of the Sea and back.
  {
    handle: "divina",
    film: "home-hero",
    bg: "#163A4E",
    alt: "A bottle of Divina in a clear blue sky, ringed by a pink swirl with gardenia, iris, pink pepper and bergamot",
  },
  { handle: "vintage-vanilla", bg: "#3D2614", alt: "A bottle of Vintage Vanilla in a pool of vanilla custard, with vanilla pods and tonka beans" },
  { handle: "linen", bg: "#2F2C28", alt: "A bottle of Linen on whipped cream, with iris, white blossom, black pepper and dried herbs" },
  { handle: "mango-eclipse", bg: "#4A2508", alt: "A bottle of Mango Eclipse in mango purée, with honeycomb, rose petals and jasmine" },
  { handle: "neroli-code", bg: "#1E1916", alt: "A bottle of Neroli Code on melted chocolate, with orange blossom and its leaves" },
  { handle: "raw-seduction", bg: "#3A2817", alt: "A bottle of Raw Seduction in amber syrup, with apple slices, cardamom, cedar and wood chips" },
];

export const heroByHandle = (handle: string | null | undefined): Hero | null => heroes.find((h) => h.handle === handle) ?? null;
