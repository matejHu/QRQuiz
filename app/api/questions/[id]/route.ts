import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { question_text, type, points, order_index, options } = body;

  // Ownership check via join
  const { data: existing } = await supabase
    .from("questions")
    .select("id, quiz_id, quizzes!inner(creator_id)")
    .eq("id", id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!existing || (existing.quizzes as any)?.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  await supabase.from("questions").update({
    question_text: question_text?.trim(),
    type,
    points,
    order_index,
  }).eq("id", id);

  // Replace options if provided
  if (options && Array.isArray(options)) {
    await supabase.from("question_options").delete().eq("question_id", id);
    if (options.length > 0) {
      const rows = options.map((o: { option_text: string; is_correct?: boolean }, i: number) => ({
        question_id: id,
        option_text: o.option_text,
        is_correct: Boolean(o.is_correct),
        order_index: i,
      }));
      await supabase.from("question_options").insert(rows);
    }
  }

  const { data: full } = await supabase
    .from("questions")
    .select("*, question_options(*)")
    .eq("id", id)
    .single();

  return NextResponse.json(full);
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("questions")
    .select("id, quiz_id, quizzes!inner(creator_id)")
    .eq("id", id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!existing || (existing.quizzes as any)?.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  await supabase.from("questions").delete().eq("id", id);
  return new NextResponse(null, { status: 204 });
}
