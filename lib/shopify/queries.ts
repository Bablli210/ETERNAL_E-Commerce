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

/** Handles in Shopify's best-selling order, for the bestsellers collection. */
export async function fetchBestsellingHandles(first = 12): Promise<string[]> {
  const data: { products: { nodes: { handle: string }[] } } = await storefront(
    /* GraphQL */ `
      query Bestselling($first: Int!) {
        products(first: $first, sortKey: BEST_SELLING) { nodes { handle } }
      }
    `,
    { first },
    { tags: ["products"] },
  );
  return data.products.nodes.map((n) => n.handle);
}

export type CheckoutLine = { merchandiseId: string; quantity: number };

/** Creates a Storefront cart from the local bag and returns Shopify's checkout URL. */
export async function createCheckout(lines: CheckoutLine[]): Promise<string> {
  const data: { cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } } = await storefront(
    /* GraphQL */ `
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }
    `,
    { lines },
    { revalidate: false },
  );
  if (!data.cartCreate.cart) throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; ") || "Cart could not be created");
  return data.cartCreate.cart.checkoutUrl;
}
