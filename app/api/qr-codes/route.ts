import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const query = supabase
    .from("qr_codes")
    .select("*, quizzes(id, title), questions!locked_question_id(id, question_text)")
    .order("created_at", { ascending: false });

  if (profile?.role !== "admin") {
    query.eq("creator_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, label, location_description, current_quiz_id, locked_question_id } = body;

  if (!label?.trim()) return NextResponse.json({ error: "Label is required." }, { status: 400 });
  if (type !== "dynamic" && type !== "static") {
    return NextResponse.json({ error: "Type must be dynamic or static." }, { status: 400 });
  }
  if (type === "static" && !locked_question_id) {
    return NextResponse.json({ error: "Static QR codes require a locked_question_id." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .insert({
      type,
      label: label.trim(),
      location_description: location_description?.trim() || null,
      creator_id: user.id,
      current_quiz_id: type === "dynamic" ? (current_quiz_id || null) : null,
      locked_question_id: type === "static" ? locked_question_id : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
