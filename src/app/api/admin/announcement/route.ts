import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { cleanLink } from "@/lib/adminPromos";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.db
    .from("announcements")
    .select("text, link_url, is_active")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    announcement: data ?? { text: "", link_url: null, is_active: false },
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);

  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (text.length > 160) {
    return NextResponse.json(
      { error: "The message is too long (160 characters max)." },
      { status: 400 }
    );
  }

  const link = cleanLink(body?.link_url);

  if (!link.ok) {
    return NextResponse.json(
      {
        error:
          "The link must start with https:// (or / for a page on your site).",
      },
      { status: 400 }
    );
  }

  const { data, error } = await auth.db
    .from("announcements")
    .upsert({
      id: 1,
      text,
      link_url: link.value,
      is_active: body?.is_active === true,
    })
    .select("text, link_url, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data });
}