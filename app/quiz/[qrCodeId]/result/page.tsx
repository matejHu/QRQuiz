import { Suspense } from "react";
import { ResultContent } from "./ResultContent";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-16"><p className="text-muted-foreground">Loading result…</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
