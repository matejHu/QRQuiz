"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export function QuizTimer({ totalSeconds, onTimeUp }: QuizTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining <= 30;

  return (
    <Badge variant={isLow ? "destructive" : "secondary"} className="text-sm tabular-nums">
      {minutes}:{String(seconds).padStart(2, "0")}
    </Badge>
  );
}
