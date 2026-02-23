import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quiz_id, active_from, active_until, notes } = await request.json();

  if (!quiz_id || !active_from) {
    return NextResponse.json({ error: "quiz_id and active_from are required." }, { status: 400 });
  }

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("type, creator_id")
    .eq("id", id)
    .single();

  if (!qr || qr.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }
  if (qr.type === "static") {
    return NextResponse.json({ error: "Cannot schedule a static QR code." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("qr_code_assignments")
    .insert({
      qr_code_id: id,
      quiz_id,
      assigned_by: user.id,
      active_from,
      active_until: active_until || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
