import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const { id: quiz_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: quiz } = await supabase.from("quizzes").select("creator_id").eq("id", quiz_id).single();
  if (!quiz || quiz.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { question_text, type, points, order_index, options } = body;

  if (!question_text?.trim() || !type) {
    return NextResponse.json({ error: "question_text and type are required." }, { status: 400 });
  }

  // Get next order_index if not provided
  let idx = order_index;
  if (idx === undefined) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quiz_id);
    idx = count ?? 0;
  }

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .insert({ quiz_id, question_text: question_text.trim(), type, points: points ?? 10, order_index: idx })
    .select()
    .single();

  if (qErr || !question) return NextResponse.json({ error: qErr?.message }, { status: 500 });

  // Insert options if provided
  if (options && Array.isArray(options) && options.length > 0) {
    const optRows = options.map((o: { option_text: string; is_correct?: boolean }, i: number) => ({
      question_id: question.id,
      option_text: o.option_text,
      is_correct: Boolean(o.is_correct),
      order_index: i,
    }));
    await supabase.from("question_options").insert(optRows);
  }

  // Return with options
  const { data: full } = await supabase
    .from("questions")
    .select("*, question_options(*)")
    .eq("id", question.id)
    .single();

  return NextResponse.json(full, { status: 201 });
}
