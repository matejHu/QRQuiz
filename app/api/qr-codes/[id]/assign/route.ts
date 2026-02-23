import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quiz_id, notes } = await request.json();

  // Verify QR code ownership and type
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("type, creator_id")
    .eq("id", id)
    .single();

  if (!qr || qr.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }
  if (qr.type === "static") {
    return NextResponse.json({ error: "Cannot reassign a static QR code." }, { status: 400 });
  }

  // Update current assignment
  await supabase.from("qr_codes").update({ current_quiz_id: quiz_id }).eq("id", id);

  // Log the change
  await supabase.from("qr_code_assignments").insert({
    qr_code_id: id,
    quiz_id,
    assigned_by: user.id,
    notes: notes || null,
  });

  return NextResponse.json({ success: true });
}
