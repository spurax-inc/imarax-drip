import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type IncomingItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

type Customer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

type StoredVariant = {
  id: number;
  color: string;
  size: string;
  available: boolean;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body?.items as IncomingItem[] | undefined;
    const customer = body?.customer as Customer | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return bad("Your cart is empty.");
    }

    if (
      !customer ||
      !customer.fullName?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim() ||
      !customer.city?.trim() ||
      !customer.state?.trim() ||
      !customer.country?.trim()
    ) {
      return bad("Please fill in all delivery details.");
    }

    const admin = createAdminClient();

    // Read prices from the database, never from the browser.
    const ids = [...new Set(items.map((i) => i.productId))];

    const { data: products, error: productError } = await admin
      .from("products")
      .select(
        "id, name, price, currency, sizes, colors, is_active, track_stock, stock, printify_product_id, printify_variants"
      )
      .in("id", ids);

    if (productError || !products) {
      return bad("Could not load products.", 500);
    }

    // Total quantity wanted per product (same product can be in the cart twice).
    const wanted = new Map<string, number>();

    for (const item of items) {
      wanted.set(
        item.productId,
        (wanted.get(item.productId) ?? 0) + Number(item.quantity)
      );
    }

    const lines: {
      product_id: string;
      name: string;
      size: string;
      color: string;
      quantity: number;
      unit_price: number;
      printify_product_id: string | null;
      printify_variant_id: number | null;
    }[] = [];

    let subtotal = 0;
    let currency = "NGN";

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product || !product.is_active) {
        return bad("One of the products is no longer available.");
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return bad("Invalid quantity.");
      }

      if (product.track_stock) {
        const available = Number(product.stock) || 0;

        if (available <= 0) {
          return bad(`${product.name} is sold out.`);
        }

        if ((wanted.get(product.id) ?? 0) > available) {
          return bad(
            `Only ${available} of ${product.name} left. Please lower the quantity in your cart.`
          );
        }
      }

      const sizes = asStrings(product.sizes);
      const colors = asStrings(product.colors);

      if (sizes.length > 0 && !sizes.includes(item.size)) {
        return bad(`Please choose a valid size for ${product.name}.`);
      }

      if (colors.length > 0 && !colors.includes(item.color)) {
        return bad(`Please choose a valid color for ${product.name}.`);
      }

      let printifyProductId: string | null = null;
      let printifyVariantId: number | null = null;

      if (product.printify_product_id) {
        const variants = Array.isArray(product.printify_variants)
          ? (product.printify_variants as StoredVariant[])
          : [];

        const match = variants.find(
          (v) =>
            v.available !== false &&
            (colors.length === 0 || v.color === item.color) &&
            (sizes.length === 0 || v.size === item.size)
        );

        if (!match) {
          return bad(
            `${product.name} is not available in that size and color.`
          );
        }

        printifyProductId = product.printify_product_id;
        printifyVariantId = match.id;
      }

      const unitPrice = Number(product.price);
      currency = product.currency;
      subtotal += unitPrice * quantity;

      lines.push({
        product_id: product.id,
        name: product.name,
        size: item.size,
        color: item.color,
        quantity,
        unit_price: unitPrice,
        printify_product_id: printifyProductId,
        printify_variant_id: printifyVariantId,
      });
    }

    if (subtotal <= 0) {
      return bad("Invalid order total.");
    }

    // If the customer is signed in, link the order to their account.
    let userId: string | null = null;
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const reference = `IMX-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        reference,
        user_id: userId,
        email: customer.email.trim(),
        full_name: customer.fullName.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        country: customer.country.trim(),
        subtotal,
        currency,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return bad("Could not create your order.", 500);
    }

    const { error: itemsError } = await admin.from("order_items").insert(
      lines.map((line) => ({ ...line, order_id: order.id }))
    );

    if (itemsError) {
      return bad("Could not save your order items.", 500);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: customer.email.trim(),
          amount: Math.round(subtotal * 100),
          currency,
          reference,
          callback_url: `${siteUrl}/checkout/success`,
        }),
      }
    );

    const paystackJson = await paystackRes.json();

    if (!paystackRes.ok || !paystackJson.status) {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
      return bad(
        paystackJson?.message ?? "Could not start the payment.",
        502
      );
    }

    return NextResponse.json({
      url: paystackJson.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.error(err);
    return bad("Something went wrong. Please try again.", 500);
  }
}