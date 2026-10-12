import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCheck =
  | { ok: true; db: SupabaseClient }
  | { ok: false; response: NextResponse };

export async function requireAdmin(request: Request): Promise<AdminCheck> {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in." }, { status: 401 }),
    };
  }

  const db = createAdminClient();
  const { data } = await db.auth.getUser(header.slice(7));
  const email = data.user?.email?.toLowerCase();

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !allowed.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have admin access." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, db };
}