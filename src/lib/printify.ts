import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/adminProducts";

const BASE = "https://api.printify.com/v1";

type PfOptionValue = { id: number; title: string };
type PfOption = { name?: string; type?: string; values?: PfOptionValue[] };
type PfVariant = {
  id: number;
  price?: number;
  title?: string;
  is_enabled?: boolean;
  is_available?: boolean;
  options?: number[];
};
type PfImage = { src: string; is_default?: boolean };
type PfProduct = {
  id: string;
  title: string;
  description?: string;
  options?: PfOption[];
  variants?: PfVariant[];
  images?: PfImage[];
};

export type StoredVariant = {
  id: number;
  color: string;
  size: string;
  price: number;
  available: boolean;
};

function creds() {
  return {
    token: process.env.PRINTIFY_API_TOKEN?.trim() || null,
    shopId: process.env.PRINTIFY_SHOP_ID?.trim() || null,
  };
}

async function pf(path: string, init: { method?: string; body?: string } = {}) {
  const { token } = creds();

  if (!token) {
    throw new Error(
      "Printify is not connected. Add PRINTIFY_API_TOKEN to .env.local."
    );
  }

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ImaraxDrip/1.0",
    },
    cache: "no-store",
  });

  const text = await res.text();

  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    let message = text.slice(0, 300) || `HTTP ${res.status}`;

    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (typeof obj.message === "string") message = obj.message;
      else if (obj.errors) message = JSON.stringify(obj.errors).slice(0, 300);
    }

    throw new Error(`Printify error (${res.status}): ${message}`);
  }

  return json;
}

export async function listPrintifyShops(): Promise<
  { id: number | string; title: string; sales_channel?: string }[]
> {
  const json = await pf("/shops.json");
  return Array.isArray(json) ? json : [];
}

function labelFor(options: PfOption[], optionIds: number[]) {
  let color = "";
  let size = "";

  for (const option of options) {
    const match = option.values?.find((v) => optionIds.includes(v.id));
    if (!match) continue;

    const kind = `${option.type ?? ""} ${option.name ?? ""}`.toLowerCase();

    if (kind.includes("color") || kind.includes("colour")) color = match.title;
    else if (kind.includes("size")) size = match.title;
  }

  return { color, size };
}

function pickCategory(title: string) {
  const text = title.toLowerCase();

  if (/(shoe|sneaker|slide|sandal|boot|flip.?flop|slipper)/.test(text)) {
    return "Footwear";
  }

  if (/(cap|hat|beanie|bag|tote|mug|bottle|case|sock|scarf|backpack)/.test(text)) {
    return "Accessories";
  }

  return "Clothing";
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export async function syncPrintifyProducts() {
  const { shopId } = creds();

  if (!shopId) {
    throw new Error("Add PRINTIFY_SHOP_ID to .env.local first.");
  }

  const rate = Number(process.env.PRINTIFY_USD_TO_NGN);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(
      "Add PRINTIFY_USD_TO_NGN (the dollar to naira rate) to .env.local first."
    );
  }

  const db = createAdminClient();
  const result = { created: 0, updated: 0, skipped: 0, notes: [] as string[] };

  let page = 1;
  let lastPage = 1;

  do {
    const json = (await pf(
      `/shops/${shopId}/products.json?page=${page}&limit=50`
    )) as { data?: PfProduct[]; last_page?: number } | null;

    lastPage = json?.last_page ?? 1;

    for (const product of json?.data ?? []) {
      const options = product.options ?? [];
      const enabled = (product.variants ?? []).filter(
        (v) => v.is_enabled !== false
      );

      if (enabled.length === 0) {
        result.skipped++;
        result.notes.push(`"${product.title}" has no enabled variants, skipped.`);
        continue;
      }

      const variants: StoredVariant[] = enabled.map((variant) => {
        let { color, size } = labelFor(options, variant.options ?? []);

        if (!color && !size && variant.title?.includes("/")) {
          const parts = variant.title.split("/").map((p) => p.trim());
          color = parts[0] ?? "";
          size = parts[1] ?? "";
        }

        return {
          id: variant.id,
          color,
          size,
          price: variant.price ?? 0,
          available: variant.is_available !== false,
        };
      });

      const sizes = unique(variants.map((v) => v.size));
      const colors = unique(variants.map((v) => v.color));

      const prices = variants.map((v) => v.price).filter((p) => p > 0);
      const minCents = prices.length > 0 ? Math.min(...prices) : 0;
      const price = Math.ceil((minCents / 100) * rate / 100) * 100;

      const images = unique(
        [...(product.images ?? [])]
          .sort((a, b) => Number(b.is_default === true) - Number(a.is_default === true))
          .map((img) => img.src)
      ).slice(0, 8);

      const { data: existing } = await db
        .from("products")
        .select("id")
        .eq("printify_product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await db
          .from("products")
          .update({
            images,
            image_url: images[0] ?? null,
            sizes,
            colors,
            printify_variants: variants,
          })
          .eq("id", existing.id);

        if (error) {
          result.notes.push(`Could not update "${product.title}": ${error.message}`);
        } else {
          result.updated++;
        }

        continue;
      }

      const base = slugify(product.title);
      let slug = base;
      let inserted = false;

      for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
        const { error } = await db.from("products").insert({
          name: product.title,
          slug,
          description: product.description
            ? product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
            : null,
          category: pickCategory(product.title),
          price,
          currency: "NGN",
          images,
          image_url: images[0] ?? null,
          sizes,
          colors,
          is_featured: false,
          is_active: false,
          printify_product_id: product.id,
          printify_variants: variants,
        });

        if (!error) {
          inserted = true;
          result.created++;
        } else if (error.code === "23505") {
          slug = `${base}-${product.id.slice(-4)}${attempt > 0 ? attempt : ""}`;
        } else {
          result.notes.push(`Could not add "${product.title}": ${error.message}`);
          break;
        }
      }
    }

    page++;
  } while (page <= lastPage);

  return result;
}

const COUNTRIES: Record<string, string> = {
  nigeria: "NG",
  ghana: "GH",
  kenya: "KE",
  "south africa": "ZA",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  usa: "US",
  us: "US",
  canada: "CA",
};

function toCountryCode(input: string) {
  const key = input.trim().toLowerCase();

  if (COUNTRIES[key]) return COUNTRIES[key];
  if (/^[a-z]{2}$/.test(key)) return key.toUpperCase();

  return null;
}

export async function submitOrderToPrintify(orderId: string) {
  const { token, shopId } = creds();

  // Not connected yet: nothing to do.
  if (!token || !shopId) return;

  const db = createAdminClient();

  const { data: order } = await db
    .from("orders")
    .select(
      "id, reference, email, full_name, phone, address, city, state, country, order_items(printify_product_id, printify_variant_id, quantity)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const lines = (order.order_items ?? []).filter(
    (item: { printify_product_id: string | null; printify_variant_id: number | null }) =>
      item.printify_product_id && item.printify_variant_id
  );

  // Nothing in this order is a Printify product.
  if (lines.length === 0) return;

  // Claim the order so it is only ever sent once.
  const { data: claimed } = await db
    .from("orders")
    .update({ printify_status: "submitting", printify_error: null })
    .eq("id", order.id)
    .is("printify_status", null)
    .select("id");

  if (!claimed || claimed.length === 0) return;

  try {
    const country = toCountryCode(order.country);

    if (!country) {
      throw new Error(`Unsupported country: ${order.country}`);
    }

    const [first, ...rest] = String(order.full_name).trim().split(/\s+/);

    const body = {
      external_id: order.reference,
      label: order.reference,
      line_items: lines.map(
        (item: {
          printify_product_id: string;
          printify_variant_id: number;
          quantity: number;
        }) => ({
          product_id: item.printify_product_id,
          variant_id: Number(item.printify_variant_id),
          quantity: item.quantity,
        })
      ),
      shipping_method: 1,
      is_printify_express: false,
      send_shipping_notification: false,
      address_to: {
        first_name: first || order.full_name,
        last_name: rest.join(" ") || first || order.full_name,
        email: order.email,
        phone: order.phone,
        country,
        region: order.state,
        address1: order.address,
        address2: "",
        city: order.city,
        zip: "",
      },
    };

    const created = (await pf(`/shops/${shopId}/orders.json`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as { id?: string } | null;

    if (!created?.id) {
      throw new Error("Printify did not return an order id.");
    }

    let status = "created";

    if (process.env.PRINTIFY_AUTO_PRODUCE === "true") {
      await pf(`/shops/${shopId}/orders/${created.id}/send_to_production.json`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      status = "in_production";
    }

    await db
      .from("orders")
      .update({
        printify_order_id: created.id,
        printify_status: status,
        printify_error: null,
      })
      .eq("id", order.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await db
      .from("orders")
      .update({ printify_status: "failed", printify_error: message.slice(0, 500) })
      .eq("id", order.id);
  }
}

export async function retryPrintifyOrder(orderId: string) {
  const db = createAdminClient();

  await db
    .from("orders")
    .update({ printify_status: null, printify_error: null })
    .eq("id", orderId)
    .eq("printify_status", "failed");

  await submitOrderToPrintify(orderId);
}