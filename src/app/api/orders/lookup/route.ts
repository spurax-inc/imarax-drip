import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const reference = (url.searchParams.get("reference") ?? "").trim();
  const key = (url.searchParams.get("key") ?? "").trim();
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  const notFound = () =>
    NextResponse.json(
      {
        error:
          "We could not find that order. Please check the order number and email.",
      },
      { status: 404 }
    );

  if (!reference || (!key && !email)) return notFound();

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "reference, access_token, status, fulfilment_status, tracking_note, created_at, paid_at, shipped_at, full_name, email, phone, address, city, state, country, subtotal, currency, order_items(name, size, color, quantity, unit_price)"
    )
    .eq("reference", reference)
    .maybeSingle();

  if (!order) return notFound();

  const keyOk = key !== "" && key === String(order.access_token);
  const emailOk =
    email !== "" && email === String(order.email).trim().toLowerCase();

  if (!keyOk && !emailOk) return notFound();

  return NextResponse.json({
    order: {
      reference: order.reference,
      key: order.access_token,
      status: order.status,
      fulfilment_status: order.fulfilment_status,
      tracking_note: order.tracking_note,
      created_at: order.created_at,
      paid_at: order.paid_at,
      shipped_at: order.shipped_at,
      full_name: order.full_name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      country: order.country,
      subtotal: Number(order.subtotal),
      currency: order.currency,
      items: (order.order_items ?? []).map(
        (item: {
          name: string;
          size: string | null;
          color: string | null;
          quantity: number;
          unit_price: number;
        }) => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
        })
      ),
    },
  });
}