import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("qr_codes")
    .select(`
      *,
      quizzes(id, title, description, time_limit_seconds),
      questions!locked_question_id(id, question_text, type, points),
      qr_code_assignments(*, quizzes(id, title))
    `)
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sort assignments newest first
  if (data.qr_code_assignments) {
    data.qr_code_assignments.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return NextResponse.json(data);
}
