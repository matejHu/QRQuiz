import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const isCreator = profile?.role === "creator" || profile?.role === "admin";

  const [{ data: quizzes, count: quizCount }, { data: qrCodes, count: qrCount }] = await Promise.all([
    isCreator
      ? supabase.from("quizzes").select("id, title, created_at", { count: "exact" }).eq("creator_id", user.id).order("created_at", { ascending: false }).limit(5)
      : { data: [], count: 0 },
    isCreator
      ? supabase.from("qr_codes").select("id, label, type", { count: "exact" }).eq("creator_id", user.id).order("created_at", { ascending: false }).limit(5)
      : { data: [], count: 0 },
  ]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile?.display_name}</h1>
          <Badge variant="outline" className="mt-1 capitalize">{profile?.role}</Badge>
        </div>
        {isCreator && (
          <Link href="/create">
            <Button>Creator hub</Button>
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {isCreator && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">My quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{quizCount ?? 0}</p>
                <Link href="/create/quiz">
                  <Button variant="link" className="px-0 mt-1 text-sm">+ New quiz</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">QR codes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{qrCount ?? 0}</p>
                <Link href="/create/qr">
                  <Button variant="link" className="px-0 mt-1 text-sm">+ New QR code</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isCreator && quizzes && quizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {quizzes.map((q) => (
                <div key={q.id} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{q.title}</span>
                  <Link href={`/create/quiz/${q.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isCreator && qrCodes && qrCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent QR codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={qr.type === "static" ? "secondary" : "default"} className="text-xs">{qr.type}</Badge>
                    <span className="text-sm">{qr.label}</span>
                  </div>
                  <Link href={`/create/qr/${qr.id}`}>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href="/leaderboard">
          <Button variant="outline">Leaderboard</Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline">My profile</Button>
        </Link>
      </div>
    </div>
  );
}
