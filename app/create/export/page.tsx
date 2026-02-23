"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  type: string;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface QrSheetItem {
  question_id: string;
  qr_code_id: string;
  label: string;
  question_text: string;
  question_type: string;
  points: number;
  url: string;
  qr_image_base64: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "MC",
  true_false: "T/F",
  short_text: "Text",
  multiple_select: "Multi",
};

export default function ExportPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sheetData, setSheetData] = useState<QrSheetItem[] | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((data: Quiz[]) =>
        Promise.all(
          data.map(async (q) => {
            const res = await fetch(`/api/quizzes/${q.id}`);
            const full = await res.json();
            return { ...q, questions: full.questions ?? [] };
          })
        )
      )
      .then(setQuizzes);
  }, []);

  const allQuestions = quizzes.flatMap((q) =>
    q.questions.map((qu) => ({ ...qu, quizTitle: q.title }))
  );

  const filtered = search.trim()
    ? allQuestions.filter(
        (q) =>
          q.question_text.toLowerCase().includes(search.toLowerCase()) ||
          q.quizTitle.toLowerCase().includes(search.toLowerCase())
      )
    : allQuestions;

  function toggleQuestion(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((q) => q.id)));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  async function generateSheet() {
    if (selected.size === 0) { toast.error("Select at least one question."); return; }
    setGenerating(true);
    const res = await fetch("/api/export/qr-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_ids: [...selected] }),
    });
    if (!res.ok) {
      toast.error("Failed to generate QR sheet.");
      setGenerating(false);
      return;
    }
    const data = await res.json();
    setSheetData(data);
    setGenerating(false);
    setTimeout(() => printRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Export QR sheet</h1>
        {selected.size > 0 && (
          <Button onClick={generateSheet} disabled={generating}>
            {generating ? "Generating…" : `Generate sheet (${selected.size})`}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Select questions below. Each selected question will get its own static QR code on the printed sheet.
        Scanning the QR code will always open that exact question.
      </p>

      {/* Question picker */}
      <div className="flex flex-col gap-3 no-print">
        <div className="flex gap-3 items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={selectAll}>Select all visible</Button>
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {selected.size} selected
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map((q) => (
            <div
              key={q.id}
              onClick={() => toggleQuestion(q.id)}
              className={[
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selected.has(q.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              ].join(" ")}
            >
              <div
                className={[
                  "w-4 h-4 mt-0.5 border rounded flex-shrink-0",
                  selected.has(q.id) ? "bg-primary border-primary" : "border-muted-foreground",
                ].join(" ")}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{q.quizTitle}</span>
                  <Badge variant="outline" className="text-xs py-0">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                  <span className="text-xs text-muted-foreground">{q.points} pts</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No questions found.</p>
          )}
        </div>
      </div>

      {/* Printable sheet */}
      {sheetData && (
        <div ref={printRef} className="flex flex-col gap-4">
          <div className="flex items-center justify-between no-print">
            <h2 className="font-semibold">QR Sheet Preview</h2>
            <Button onClick={handlePrint} variant="outline">Print / Save PDF</Button>
          </div>

          <div
            className="qr-sheet grid gap-4 p-6 border rounded-lg bg-white"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
          >
            {sheetData.map((item) => (
              <Card key={item.qr_code_id} className="text-center overflow-hidden">
                <CardContent className="p-3 flex flex-col items-center gap-2">
                  <img
                    src={item.qr_image_base64}
                    alt={item.question_text}
                    className="w-36 h-36"
                  />
                  <p className="text-xs font-medium leading-tight line-clamp-3">
                    {item.question_text}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs py-0">
                      {TYPE_LABELS[item.question_type] ?? item.question_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.points} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          .qr-sheet { border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
