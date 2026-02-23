"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnonymousStudent } from "@/hooks/useAnonymousStudent";
import type { Profile } from "@/lib/supabase/types";

interface Attempt {
  id: string;
  score: number;
  max_score: number;
  submitted_at: string;
  quizzes?: { title: string } | null;
  qr_codes?: { label: string } | null;
}

interface ProfileData {
  profile: Profile;
  attempts: Attempt[];
  total_points: number;
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const { student } = useAnonymousStudent();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then(setData);
  }, []);

  const isRegistered = Boolean(data?.profile);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Identity card */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {isRegistered
              ? data!.profile.display_name.charAt(0).toUpperCase()
              : (student?.display_name?.charAt(0).toUpperCase() ?? "?")}
          </div>
          <div>
            <p className="font-semibold">
              {isRegistered ? data!.profile.display_name : (student?.display_name ?? "Anonymous")}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {isRegistered ? (
                <Badge variant="outline" className="capitalize">{data!.profile.role}</Badge>
              ) : (
                <Badge variant="secondary">Anonymous (no account)</Badge>
              )}
            </div>
          </div>
          {isRegistered && (
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary">{data!.total_points}</p>
              <p className="text-xs text-muted-foreground">total points</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent attempts */}
      {isRegistered && data!.attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {data!.attempts.map((a) => {
                const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
                return (
                  <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.quizzes?.title ?? "Single question"}
                      </p>
                      {a.qr_codes?.label && (
                        <p className="text-xs text-muted-foreground">{a.qr_codes.label}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">{pct}%</p>
                      <p className="text-xs text-muted-foreground">
                        {a.score}/{a.max_score} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!isRegistered && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>You&apos;re playing as <strong>{student?.display_name ?? "anonymous"}</strong>.</p>
            <p className="mt-1">Your scores are saved in this browser. Create an account to track across devices.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
