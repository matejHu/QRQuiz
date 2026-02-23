import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("quiz_attempts")
      .select("id, score, max_score, submitted_at, quizzes(title), qr_codes(label)")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(20),
  ]);

  const totalPoints = (attempts ?? []).reduce((sum, a) => sum + a.score, 0);

  return NextResponse.json({ profile, attempts: attempts ?? [], total_points: totalPoints });
}
