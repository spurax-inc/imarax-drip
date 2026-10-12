const CATEGORIES = ["Clothing", "Footwear", "Accessories"];

export type CleanProduct = {
  name: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  images: string[];
  image_url: string | null;
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  is_active: boolean;
  source?: string;
  track_stock?: boolean;
  stock?: number;
};

export function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "product"
  );
}

export function cleanProduct(
  body: unknown
): { ok: true; value: CleanProduct } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid data." };
  }

  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "Please enter a product name." };

  const category = typeof b.category === "string" ? b.category : "";
  if (!CATEGORIES.includes(category)) {
    return { ok: false, error: "Please choose a category." };
  }

  const price = Number(b.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Please enter a price above 0." };
  }

  const images = toList(b.images);
  const description =
    typeof b.description === "string" && b.description.trim() !== ""
      ? b.description.trim()
      : null;

  const value: CleanProduct = {
    name,
    description,
    category,
    price,
    currency: "NGN",
    images,
    image_url: images[0] ?? null,
    sizes: toList(b.sizes),
    colors: toList(b.colors),
    is_featured: b.is_featured === true,
    is_active: b.is_active !== false,
  };

  // Optional: only changed when the form actually sends them.
  if (typeof b.source === "string" && b.source.trim() !== "") {
    value.source = b.source.trim().slice(0, 40);
  }

  if (typeof b.track_stock === "boolean") {
    value.track_stock = b.track_stock;
  }

  if (b.stock !== undefined) {
    const stock = Number(b.stock);

    if (Number.isInteger(stock) && stock >= 0 && stock <= 100000) {
      value.stock = stock;
    }
  }

  return { ok: true, value };
}