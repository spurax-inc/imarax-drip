import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { cleanProduct } from "@/lib/adminProducts";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = cleanProduct(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await auth.db
    .from("products")
    .update(parsed.value)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const { error } = await auth.db.from("products").delete().eq("id", id);

  if (!error) {
    return NextResponse.json({ ok: true, archived: false });
  }

  // A product that already has orders cannot be deleted, so hide it instead.
  if (error.code === "23503") {
    const { error: hideError } = await auth.db
      .from("products")
      .update({ is_active: false, is_featured: false })
      .eq("id", id);

    if (hideError) {
      return NextResponse.json({ error: hideError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, archived: true });
  }

  return NextResponse.json({ error: error.message }, { status: 500 });
}