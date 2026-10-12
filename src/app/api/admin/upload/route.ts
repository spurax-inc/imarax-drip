import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Please upload an image file." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Each picture must be under 4 MB." },
      { status: 400 }
    );
  }

  const ext =
    (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await auth.db.storage
    .from("product-images")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = auth.db.storage.from("product-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}