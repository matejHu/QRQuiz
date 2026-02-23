"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/supabase/types";

interface NavbarProps {
  user: { id: string } | null;
  profile: Profile | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isCreatorOrAdmin =
    profile?.role === "creator" || profile?.role === "admin";

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg tracking-tight">
          QRQuizes
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm">Leaderboard</Button>
          </Link>

          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant={pathname.startsWith("/dashboard") ? "secondary" : "ghost"}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>

              {isCreatorOrAdmin && (
                <Link href="/create">
                  <Button
                    variant={pathname.startsWith("/create") ? "secondary" : "ghost"}
                    size="sm"
                  >
                    Create
                  </Button>
                </Link>
              )}

              {profile?.role === "admin" && (
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
                    size="sm"
                  >
                    Admin
                  </Button>
                </Link>
              )}

              <Link href="/profile" className="flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {profile?.display_name}
                </span>
                {profile?.role && profile.role !== "student" && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {profile.role}
                  </Badge>
                )}
              </Link>

              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
