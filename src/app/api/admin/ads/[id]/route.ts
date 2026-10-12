import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { cleanAd } from "@/lib/adminPromos";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = cleanAd(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await auth.db
    .from("ads")
    .update(parsed.value)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ad: data });
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const { error } = await auth.db.from("ads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}