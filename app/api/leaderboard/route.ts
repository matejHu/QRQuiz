import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();

  const [{ data: anon }, { data: registered }] = await Promise.all([
    supabase
      .from("anonymous_students")
      .select("id, display_name, total_points")
      .order("total_points", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("role", "student"),
  ]);

  // For registered students, sum their attempt scores
  const registeredWithPoints = await Promise.all(
    (registered ?? []).map(async (p) => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("score")
        .eq("user_id", p.id);
      const total = (data ?? []).reduce((sum, a) => sum + a.score, 0);
      return { id: p.id, display_name: p.display_name, total_points: total, type: "registered" as const };
    })
  );

  const anonEntries = (anon ?? []).map((s) => ({
    id: s.id,
    display_name: s.display_name,
    total_points: s.total_points,
    type: "anonymous" as const,
  }));

  const combined = [...anonEntries, ...registeredWithPoints]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 20);

  return NextResponse.json(combined);
}
