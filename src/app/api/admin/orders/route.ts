import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { sendEmail, shippedEmail } from "@/lib/email";

const FULFILMENT = ["new", "packed", "shipped", "delivered"];

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("orders")
    .select(
      "id, reference, status, full_name, email, phone, address, city, state, country, subtotal, currency, created_at, fulfilment_status, tracking_note, printify_order_id, printify_status, printify_error, order_items(name, size, color, quantity, unit_price, printify_product_id)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);

  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.fulfilment_status;

  if (!id || typeof status !== "string" || !FULFILMENT.includes(status)) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const tracking =
    typeof body?.tracking_note === "string"
      ? body.tracking_note.trim().slice(0, 300)
      : "";

  const { data: before } = await auth.db
    .from("orders")
    .select("fulfilment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (!before) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const firstShipped =
    status === "shipped" && before.fulfilment_status !== "shipped";

  const update: Record<string, unknown> = {
    fulfilment_status: status,
    tracking_note: tracking || null,
  };

  if (firstShipped) update.shipped_at = new Date().toISOString();

  const { error } = await auth.db.from("orders").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let emailSent = false;

  if (firstShipped && before.status === "paid") {
    try {
      const { data: order } = await auth.db
        .from("orders")
        .select(
          "reference, access_token, full_name, email, address, city, state, country, subtotal, currency, order_items(name, size, color, quantity, unit_price)"
        )
        .eq("id", id)
        .maybeSingle();

      if (order) {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

        const mail = shippedEmail({
          reference: order.reference,
          full_name: order.full_name,
          email: order.email,
          address: order.address,
          city: order.city,
          state: order.state,
          country: order.country,
          subtotal: Number(order.subtotal),
          currency: order.currency,
          tracking_note: tracking || null,
          trackUrl: `${siteUrl}/order/${encodeURIComponent(order.reference)}?key=${order.access_token}`,
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
        });

        emailSent = await sendEmail({ to: order.email, ...mail });
      }
    } catch (err) {
      console.error("Shipped email failed", err);
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}