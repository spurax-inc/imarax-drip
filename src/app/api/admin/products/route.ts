import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { cleanProduct, slugify } from "@/lib/adminProducts";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = cleanProduct(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const base = slugify(parsed.value.name);
  let slug = base;

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await auth.db
      .from("products")
      .insert({ ...parsed.value, slug })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ product: data });
    }

    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return NextResponse.json(
    { error: "Could not create a unique link for this product." },
    { status: 500 }
  );
}