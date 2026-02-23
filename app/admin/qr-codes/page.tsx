import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QrRow {
  id: string;
  label: string;
  type: "dynamic" | "static";
  is_active: boolean;
  creator_id: string;
  current_quiz_id: string | null;
}

interface ProfileRow { id: string; display_name: string; }
interface QuizRow { id: string; title: string; }

export default async function AdminQrCodesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch QR codes and related data separately to avoid complex join type errors
  const { data: raw } = await supabase
    .from("qr_codes")
    .select("id, label, type, is_active, creator_id, current_quiz_id")
    .order("created_at" as never, { ascending: false });

  const qrCodes = (raw as QrRow[] | null) ?? [];

  // Fetch creator names
  const creatorIds = [...new Set(qrCodes.map((q) => q.creator_id))];
  const { data: profiles } = creatorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", creatorIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles as ProfileRow[] ?? []).map((p) => [p.id, p.display_name]));

  // Fetch quiz titles for dynamic QR codes
  const quizIds = [...new Set(qrCodes.filter((q) => q.current_quiz_id).map((q) => q.current_quiz_id!))];
  const { data: quizzes } = quizIds.length
    ? await supabase.from("quizzes").select("id, title").in("id", quizIds)
    : { data: [] };
  const quizMap = Object.fromEntries((quizzes as QuizRow[] ?? []).map((q) => [q.id, q.title]));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">All QR codes ({qrCodes.length})</h1>
      <div className="flex flex-col gap-2">
        {qrCodes.map((qr) => (
          <Card key={qr.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={qr.type === "static" ? "secondary" : "default"} className="text-xs flex-shrink-0">
                    {qr.type}
                  </Badge>
                  <span className="font-medium truncate">{qr.label}</span>
                  {!qr.is_active && (
                    <Badge variant="outline" className="text-xs text-destructive">inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {profileMap[qr.creator_id] ?? "—"}
                  {qr.type === "dynamic" && qr.current_quiz_id && quizMap[qr.current_quiz_id]
                    ? ` · ${quizMap[qr.current_quiz_id]}`
                    : ""}
                </p>
              </div>
              <Link href={`/create/qr/${qr.id}`}>
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
