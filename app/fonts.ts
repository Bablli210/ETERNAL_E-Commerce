import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";

/*
 * The house's three faces, from the brand kit (ETERNAL Logos and Fonts):
 *
 * - The Seasons, the primary face: titles, scent names, the originals and the
 *   tales. Regular, and its italic for the signature lines.
 * - Cabinet Grotesk for subtitles: the small capital labels and the lockup's
 *   tagline, as in the logo files.
 * - General Sans for body text and the interface.
 *
 * Each ships the one cut the site sets. Its face answers every weight the CSS
 * asks for ("100 900"), so a heading or button set at 500 or 600 draws the real
 * Regular instead of a bold the browser fakes by smearing it.
 *
 * display "optional": the first-screen faces are preloaded and small, so they
 * are almost always in time; on a slow first visit the page keeps its fallback
 * instead of reflowing the hero under the visitor.
 */

/**
 * The Seasons in this build is Fontspring's demo (TheSeasons-*-DEMO.woff2),
 * licensed for evaluation only. Its real glyphs are the letters, the digits but
 * 4, the space and , . : ; ?; every other character, the apostrophe, hyphen,
 * ampersand, brackets and 4 among them, is a "DEMO" ornament. A unicode-range
 * on each face keeps it to the real glyphs, so the browser draws everything
 * else in Cormorant and no ornament ever shows. Buy the web licence, put its
 * WOFF2 files in app/fonts/the-seasons/, point the paths below at them, delete
 * the two unicode-range declarations and set this to false; /launch-checklist
 * shows it until then.
 */
export const SEASONS_IS_DEMO = true;

export const seasons = localFont({
  src: [{ path: "./fonts/the-seasons/TheSeasons-Regular-DEMO.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-seasons",
  display: "optional",
  // Demo files only: their real glyphs (see SEASONS_IS_DEMO). Delete with the licensed files.
  declarations: [{ prop: "unicode-range", value: "U+0020, U+002C, U+002E, U+0030-0033, U+0035-003B, U+003F, U+0041-005A, U+0061-007A" }],
  // Cormorant follows it in the stack (globals.css), for the glyphs the demo lacks and while it loads.
  adjustFontFallback: false,
});

/** The signature lines only, never on the first screen: not preloaded, it swaps in out of view. */
export const seasonsItalic = localFont({
  src: [{ path: "./fonts/the-seasons/TheSeasons-Italic-DEMO.woff2", weight: "100 900", style: "italic" }],
  variable: "--font-seasons-italic",
  display: "swap",
  // Demo files only: their real glyphs (see SEASONS_IS_DEMO). Delete with the licensed files.
  declarations: [{ prop: "unicode-range", value: "U+0020, U+002C, U+002E, U+0030-0033, U+0035-003B, U+003F, U+0041-005A, U+0061-007A" }],
  preload: false,
  adjustFontFallback: false,
});

export const generalSans = localFont({
  src: [{ path: "./fonts/general-sans/GeneralSans-Regular.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-general",
  display: "optional",
  adjustFontFallback: "Arial",
});

/** Small capital labels, mostly below the first screen: loaded when a page uses them. */
export const cabinet = localFont({
  src: [{ path: "./fonts/cabinet-grotesk/CabinetGrotesk-Regular.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-cabinet",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
});

/*
 * Cormorant stays only behind The Seasons: it draws the punctuation the demo
 * files lack and stands in while The Seasons loads. Never preloaded, so a page
 * downloads it only when one of those glyphs appears.
 */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-cormorant-italic",
  display: "swap",
  preload: false,
});

export const fontVariables = [seasons, seasonsItalic, generalSans, cabinet, cormorant, cormorantItalic].map((f) => f.variable).join(" ");
