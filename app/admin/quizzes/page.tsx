import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuizRow {
  id: string;
  title: string;
  is_public: boolean;
  creator_id: string;
  created_at: string;
}

interface ProfileRow { id: string; display_name: string; }

export default async function AdminQuizzesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("quizzes")
    .select("id, title, is_public, creator_id, created_at")
    .order("created_at" as never, { ascending: false });

  const quizzes = (raw as QuizRow[] | null) ?? [];

  // Fetch creator display names separately to avoid join type errors
  const creatorIds = [...new Set(quizzes.map((q) => q.creator_id))];
  const { data: profiles } = creatorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", creatorIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles as ProfileRow[] ?? []).map((p) => [p.id, p.display_name]));

  // Fetch question counts
  const { data: qCounts } = await supabase
    .from("questions")
    .select("quiz_id");
  const countMap: Record<string, number> = {};
  ((qCounts ?? []) as { quiz_id: string }[]).forEach((q) => {
    countMap[q.quiz_id] = (countMap[q.quiz_id] ?? 0) + 1;
  });

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">All quizzes ({quizzes.length})</h1>
      <div className="flex flex-col gap-2">
        {quizzes.map((q) => (
          <Card key={q.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{q.title}</span>
                  {q.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {profileMap[q.creator_id] ?? "—"}
                  {" · "}
                  {countMap[q.id] ?? 0} questions
                </p>
              </div>
              <Link href={`/create/quiz/${q.id}`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
