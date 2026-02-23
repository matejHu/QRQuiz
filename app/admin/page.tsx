import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: userCount },
    { count: quizCount },
    { count: qrCount },
    { count: attemptCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("quizzes").select("*", { count: "exact", head: true }),
    supabase.from("qr_codes").select("*", { count: "exact", head: true }),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Registered users", value: userCount ?? 0 },
    { label: "Quizzes", value: quizCount ?? 0 },
    { label: "QR codes", value: qrCount ?? 0 },
    { label: "Quiz attempts", value: attemptCount ?? 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground font-normal">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/users">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <p className="font-semibold">Manage users</p>
              <p className="text-sm text-muted-foreground mt-1">View and change user roles</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/quizzes">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <p className="font-semibold">All quizzes</p>
              <p className="text-sm text-muted-foreground mt-1">View quizzes from all creators</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/qr-codes">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <p className="font-semibold">All QR codes</p>
              <p className="text-sm text-muted-foreground mt-1">View and manage all QR codes</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
