import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CreatorHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: quizzes }, { data: qrCodes }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, is_public, created_at, questions(count)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("qr_codes")
      .select("id, label, type, is_active, current_quiz_id, quizzes(title)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Creator hub</h1>
        <Link href="/create/export">
          <Button variant="outline">Export QR sheet</Button>
        </Link>
      </div>

      {/* Quizzes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">My quizzes</h2>
          <Link href="/create/quiz">
            <Button size="sm">+ New quiz</Button>
          </Link>
        </div>
        {quizzes && quizzes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {quizzes.map((q) => (
              <Card key={q.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-medium truncate">{q.title}</span>
                    {q.is_public && <Badge variant="outline" className="text-xs">Public</Badge>}
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {(q.questions as unknown as { count: number }[])?.[0]?.count ?? 0} questions
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/create/quiz/${q.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/create/qr?quiz=${q.id}`}>
                      <Button variant="ghost" size="sm">+ QR</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No quizzes yet.{" "}
              <Link href="/create/quiz" className="underline">Create one</Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* QR Codes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">My QR codes</h2>
          <Link href="/create/qr">
            <Button size="sm">+ New QR code</Button>
          </Link>
        </div>
        {qrCodes && qrCodes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {qrCodes.map((qr) => (
              <Card key={qr.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={qr.type === "static" ? "secondary" : "default"} className="text-xs flex-shrink-0">
                      {qr.type}
                    </Badge>
                    <span className="font-medium truncate">{qr.label}</span>
                    {qr.type === "dynamic" && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 truncate max-w-32">
                        {(qr.quizzes as unknown as { title: string } | null)?.title ?? "no quiz"}
                      </span>
                    )}
                    {!qr.is_active && (
                      <Badge variant="outline" className="text-xs text-destructive">inactive</Badge>
                    )}
                  </div>
                  <Link href={`/create/qr/${qr.id}`}>
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No QR codes yet.{" "}
              <Link href="/create/qr" className="underline">Create one</Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
