export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  image_url: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  track_stock: boolean;
  stock: number;
};

export const PRODUCT_COLUMNS =
  "id, name, slug, description, category, price, currency, image_url, images, sizes, colors, is_featured, track_stock, stock";

type ProductRow = Omit<Product, "images" | "sizes" | "colors"> & {
  images: unknown;
  sizes: unknown;
  colors: unknown;
};

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeProduct(row: ProductRow): Product {
  return {
    ...row,
    images: toStrings(row.images),
    sizes: toStrings(row.sizes),
    colors: toStrings(row.colors),
    track_stock: row.track_stock === true,
    stock: Number(row.stock) || 0,
  };
}

export function isSoldOut(product: Product): boolean {
  return product.track_stock && product.stock <= 0;
}

export function mainImage(product: Product): string | null {
  return product.images[0] ?? product.image_url;
}

export function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}