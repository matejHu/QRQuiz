"use client";

import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ResultContent() {
  const searchParams = useSearchParams();
  const { qrCodeId } = useParams<{ qrCodeId: string }>();

  const score = Number(searchParams.get("score") ?? 0);
  const max = Number(searchParams.get("max") ?? 0);
  const pct = Number(searchParams.get("pct") ?? 0);

  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
  const message =
    pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good job!" : "Keep practising!";

  return (
    <div className="flex justify-center pt-12">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <span className="text-5xl">{emoji}</span>
          <h1 className="text-2xl font-bold">{message}</h1>
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold tabular-nums">{pct}%</span>
            <span className="text-sm text-muted-foreground">
              {score} / {max} points
            </span>
          </div>

          {/* Score ring */}
          <div className="w-24 h-24 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="currentColor" strokeWidth="2"
                className={pct >= 80 ? "text-green-500" : pct >= 50 ? "text-blue-500" : "text-orange-500"}
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2">
            <Link href={`/quiz/${qrCodeId}`}>
              <Button variant="outline" className="w-full">Try again</Button>
            </Link>
            <Link href="/leaderboard">
              <Button className="w-full">View leaderboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
