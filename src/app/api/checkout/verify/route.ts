import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { paid: false, reason: "Missing reference." },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  const json = await res.json();

  if (!res.ok || !json.status || json.data?.status !== "success") {
    return NextResponse.json({
      paid: false,
      reason: json?.data?.gateway_response ?? "Payment not completed.",
    });
  }

  const result = await markOrderPaid(reference, Number(json.data.amount));

  let key: string | null = null;

  if (result.ok) {
    const admin = createAdminClient();

    const { data } = await admin
      .from("orders")
      .select("access_token")
      .eq("reference", reference)
      .maybeSingle();

    key = data?.access_token ?? null;
  }

  return NextResponse.json({ paid: result.ok, reason: result.reason, key });
}