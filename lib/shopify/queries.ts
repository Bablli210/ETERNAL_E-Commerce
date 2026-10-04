import "server-only";
import { storefront } from "./client";
import type { ShopifyImage, ShopifyMetafield, ShopifyProduct, ShopifyVariant } from "./types";

/** The metafields the boards define on products (namespace `custom`). */
export const productMetafieldKeys = [
  "line",
  "inspired_by",
  "comparison_note",
  "signature_line",
  "story",
  "color_world",
  "notes_short",
  "top_notes",
  "heart_notes",
  "base_notes",
  "notes_copy",
  "longevity",
  "sillage",
  "season",
  "occasion",
  "time_of_day",
  "scent_family",
  "mood_words",
  /** Units sold in the last 30 days, written by a daily job; the only source of the Bestseller badge. */
  "units_sold_30d",
] as const;

const identifiers = productMetafieldKeys.map((key) => `{namespace: "custom", key: "${key}"}`).join(", ");

const productFragment = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    tags
    vendor
    productType
    createdAt
    availableForSale
    images(first: 6) { nodes { url altText width height } }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 10) {
      nodes {
        id
        title
        sku
        availableForSale
        quantityAvailable
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
    metafields(identifiers: [${identifiers}]) { key value type }
  }
`;

type RawProduct = Omit<ShopifyProduct, "images" | "variants"> & {
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ShopifyVariant[] };
  metafields: ShopifyMetafield[];
};

const normalise = (p: RawProduct): ShopifyProduct => ({
  ...p,
  images: p.images.nodes,
  variants: p.variants.nodes,
  metafields: p.metafields ?? [],
});

export async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const out: ShopifyProduct[] = [];
  let after: string | null = null;
  do {
    const data: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawProduct[] } } =
      await storefront(
        /* GraphQL */ `
        ${productFragment}
        query AllProducts($after: String) {
          products(first: 100, after: $after, sortKey: TITLE) {
            pageInfo { hasNextPage endCursor }
            nodes { ...ProductFields }
          }
        }
      `,
        { after },
        { tags: ["products"] },
      );
    out.push(...data.products.nodes.map(normalise));
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return out;
}

export type CheckoutLine = { merchandiseId: string; quantity: number };

/**
 * Creates a Storefront cart from the local bag and returns Shopify's checkout
 * URL. The buyer's country is set to Egypt, so checkout opens with Egypt
 * already selected. Never cached: every Checkout tap gets a cart of its own.
 */
export async function createCheckout(lines: CheckoutLine[], attributes: { key: string; value: string }[] = [], discountCodes: string[] = [], buyerIp?: string): Promise<string> {
  const data: { cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } } = await storefront(
    /* GraphQL */ `
      mutation CreateCart($lines: [CartLineInput!]!, $attributes: [AttributeInput!], $discountCodes: [String!]) {
        cartCreate(input: { lines: $lines, attributes: $attributes, discountCodes: $discountCodes, buyerIdentity: { countryCode: EG } }) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }
    `,
    { lines, attributes, discountCodes },
    { revalidate: 0, buyerIp },
  );
  if (!data.cartCreate.cart) throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; ") || "Cart could not be created");
  return data.cartCreate.cart.checkoutUrl;
}
