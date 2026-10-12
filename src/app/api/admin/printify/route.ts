import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  listPrintifyShops,
  retryPrintifyOrder,
  syncPrintifyProducts,
} from "@/lib/printify";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const tokenSet = Boolean(process.env.PRINTIFY_API_TOKEN?.trim());
  const shopIdSet = Boolean(process.env.PRINTIFY_SHOP_ID?.trim());
  const rate = Number(process.env.PRINTIFY_USD_TO_NGN);

  let shops: { id: number | string; title: string; sales_channel?: string }[] =
    [];
  let shopsError: string | null = null;

  if (tokenSet) {
    try {
      shops = await listPrintifyShops();
    } catch (err) {
      shopsError = err instanceof Error ? err.message : "Could not reach Printify.";
    }
  }

  const { data: orders } = await auth.db
    .from("orders")
    .select(
      "id, reference, status, created_at, printify_order_id, printify_status, printify_error"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({
    tokenSet,
    shopIdSet,
    rateSet: Number.isFinite(rate) && rate > 0,
    autoProduce: process.env.PRINTIFY_AUTO_PRODUCE === "true",
    shops,
    shopsError,
    orders: orders ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);

  try {
    if (body?.action === "sync") {
      const result = await syncPrintifyProducts();
      return NextResponse.json({ result });
    }

    if (body?.action === "retry" && typeof body.orderId === "string") {
      await retryPrintifyOrder(body.orderId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong." },
      { status: 500 }
    );
  }
}