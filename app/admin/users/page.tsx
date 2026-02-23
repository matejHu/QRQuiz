import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleChanger } from "./RoleChanger";
import type { Profile } from "@/lib/supabase/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at" as never, { ascending: false });

  const users = (raw as Profile[] | null) ?? [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{u.display_name}</span>
                <Badge variant="outline" className="capitalize">{u.role}</Badge>
              </div>
              <RoleChanger userId={u.id} currentRole={u.role} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
