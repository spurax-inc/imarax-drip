import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

const CATEGORIES = ["Clothing", "Footwear", "Accessories"];

function cleanValues(
  raw: unknown
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Nothing to change." };
  }

  const r = raw as Record<string, unknown>;
  const value: Record<string, unknown> = {};

  if (typeof r.is_active === "boolean") value.is_active = r.is_active;
  if (typeof r.is_featured === "boolean") value.is_featured = r.is_featured;
  if (typeof r.track_stock === "boolean") value.track_stock = r.track_stock;

  if (r.category !== undefined) {
    if (typeof r.category !== "string" || !CATEGORIES.includes(r.category)) {
      return { ok: false, error: "Invalid category." };
    }
    value.category = r.category;
  }

  if (r.source !== undefined) {
    if (typeof r.source !== "string" || r.source.trim() === "") {
      return { ok: false, error: "Please enter a source." };
    }
    value.source = r.source.trim().slice(0, 40);
  }

  if (r.stock !== undefined) {
    const stock = Number(r.stock);

    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      return { ok: false, error: "Stock must be a whole number, 0 or more." };
    }
    value.stock = stock;
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: "Nothing to change." };
  }

  return { ok: true, value };
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = cleanValues(body?.values);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  let query = auth.db.from("products").update(parsed.value);

  if (body?.scope === "all_hidden") {
    query = query.eq("is_active", false);
  } else {
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === "string")
      : [];

    if (ids.length === 0 || ids.length > 500) {
      return NextResponse.json(
        { error: "Choose at least one product." },
        { status: 400 }
      );
    }

    query = query.in("id", ids);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}