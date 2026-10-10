/**
 * The frame that shows a scent among its notes: the local notes still
 * (products/<handle>-3, public/images/README.md) or a Shopify image whose alt
 * text or file name says "notes" (the store's stills carry "<Title> among its notes").
 * Shared by the catalogue (cards) and the product gallery, so both agree on it.
 */
export const isNotesFrame = (handle: string, url: string, altText: string | null): boolean =>
  new RegExp(`/images/products/${handle}-3\\.\\w+(\\?|$)`).test(url) || /\bnotes?\b/i.test(altText ?? "") || /[-_]notes?[-_.]/i.test(url.split("?")[0]);
