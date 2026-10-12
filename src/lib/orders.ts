import { createAdminClient } from "@/lib/supabase/admin";
import { submitOrderToPrintify } from "@/lib/printify";
import {
  adminAlertEmail,
  confirmationEmail,
  sendEmail,
} from "@/lib/email";

export async function markOrderPaid(
  reference: string,
  amountPaidKobo: number
): Promise<{ ok: boolean; reason?: string }> {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("id, subtotal, status")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, reason: "Order not found." };
  }

  if (order.status === "paid") {
    return { ok: true };
  }

  const expected = Math.round(Number(order.subtotal) * 100);

  if (amountPaidKobo !== expected) {
    return { ok: false, reason: "Paid amount does not match the order." };
  }

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paystack_reference: reference,
    })
    .eq("id", order.id)
    .neq("status", "paid")
    .select("id");

  if (updateError) {
    return { ok: false, reason: updateError.message };
  }

  // Another request already marked it paid and is handling the follow-up.
  if (!updated || updated.length === 0) {
    return { ok: true };
  }

  await afterPayment(order.id);

  return { ok: true };
}

async function afterPayment(orderId: string) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, reference, full_name, email, phone, address, city, state, country, subtotal, currency, order_items(product_id, name, size, color, quantity, unit_price)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  const items = order.order_items ?? [];

  // 1. Reduce stock for products whose stock is tracked.
  for (const item of items) {
    if (!item.product_id) continue;

    const { error } = await admin.rpc("decrement_stock", {
      p_product: item.product_id,
      p_qty: item.quantity,
    });

    if (error) console.error("Stock update failed", error.message);
  }

  // 2. Send Printify items to Printify (does nothing if not connected).
  try {
    await submitOrderToPrintify(orderId);
  } catch (err) {
    console.error("Printify submit failed", err);
  }

  // 3. Emails (skipped quietly if email is not set up).
  const emailOrder = {
    reference: order.reference,
    full_name: order.full_name,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    state: order.state,
    country: order.country,
    subtotal: Number(order.subtotal),
    currency: order.currency,
    items: items.map(
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
  };

  try {
    const customer = confirmationEmail(emailOrder);
    await sendEmail({ to: order.email, ...customer });
  } catch (err) {
    console.error("Confirmation email failed", err);
  }

  try {
    const notify =
      process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
      (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();

    if (notify) {
      const alert = adminAlertEmail(emailOrder);
      await sendEmail({ to: notify, ...alert });
    }
  } catch (err) {
    console.error("Admin alert email failed", err);
  }
}