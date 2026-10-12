import crypto from "crypto";
import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  if (!signature || hash !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(raw);

  if (event.event === "charge.success") {
    await markOrderPaid(event.data.reference, Number(event.data.amount));
  }

  return NextResponse.json({ received: true });
}