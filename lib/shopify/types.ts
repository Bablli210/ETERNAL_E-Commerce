export type Money = { amount: string; currencyCode: string };

export type ShopifyImage = { url: string; altText: string | null; width?: number | null; height?: number | null };

export type ShopifyVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};

export type ShopifyMetafield = { key: string; value: string; type?: string } | null;

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  vendor: string;
  productType: string;
  createdAt: string;
  availableForSale: boolean;
  images: ShopifyImage[];
  priceRange: { minVariantPrice: Money };
  variants: ShopifyVariant[];
  metafields: ShopifyMetafield[];
};

export type CatalogueSnapshot = { source: string; capturedAt: string; products: ShopifyProduct[] };
