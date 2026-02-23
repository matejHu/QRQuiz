"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { QuestionType } from "@/lib/supabase/types";

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question_text: string;
  type: QuestionType;
  points: number;
  order_index: number;
  question_options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_seconds: number | null;
  is_public: boolean;
  questions: Question[];
}

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  short_text: "Short text",
  multiple_select: "Multiple select",
};

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // New question form state
  const [newType, setNewType] = useState<QuestionType>("multiple_choice");
  const [newText, setNewText] = useState("");
  const [newPoints, setNewPoints] = useState("10");
  const [newOptions, setNewOptions] = useState<Option[]>([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const fetchQuiz = useCallback(async () => {
    const res = await fetch(`/api/quizzes/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    data.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
    setQuiz(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  // Reset options when type changes
  useEffect(() => {
    if (newType === "true_false") {
      setNewOptions([
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false },
      ]);
    } else if (newType === "short_text") {
      setNewOptions([{ option_text: "", is_correct: true }]);
    } else {
      setNewOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);
    }
  }, [newType]);

  async function addQuestion() {
    if (!newText.trim()) { toast.error("Question text is required."); return; }
    const validOptions = newOptions.filter((o) => o.option_text.trim());
    if (newType !== "short_text" && validOptions.filter((o) => o.is_correct).length === 0) {
      toast.error("Mark at least one correct answer.");
      return;
    }
    setAddingQuestion(true);
    const res = await fetch(`/api/quizzes/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: newText,
        type: newType,
        points: parseInt(newPoints) || 10,
        options: validOptions,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to add question.");
    } else {
      toast.success("Question added.");
      setNewText("");
      setNewPoints("10");
      setNewOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ]);
      await fetchQuiz();
    }
    setAddingQuestion(false);
  }

  async function deleteQuestion(qId: string) {
    await fetch(`/api/questions/${qId}`, { method: "DELETE" });
    setQuiz((prev) => prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== qId) } : prev);
    toast.success("Question deleted.");
  }

  function updateOption(idx: number, field: keyof Option, value: string | boolean) {
    setNewOptions((prev) => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  }

  function toggleCorrect(idx: number) {
    if (newType === "multiple_choice" || newType === "true_false") {
      // single-correct — deselect others
      setNewOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === idx })));
    } else {
      setNewOptions((prev) =>
        prev.map((o, i) => i === idx ? { ...o, is_correct: !o.is_correct } : o)
      );
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!quiz) return <p className="text-muted-foreground">Quiz not found.</p>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{quiz.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/create/qr?quiz=${quiz.id}`}>
            <Button variant="outline" size="sm">Generate QR</Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" size="sm">Back</Button>
          </Link>
        </div>
      </div>

      {/* Existing questions */}
      {quiz.questions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Questions ({quiz.questions.length})
          </h2>
          {quiz.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type]}</Badge>
                      <span className="text-xs text-muted-foreground">{q.points} pts</span>
                    </div>
                    <p className="text-sm font-medium">{q.question_text}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {q.question_options.map((o) => (
                        <li
                          key={o.id}
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            o.is_correct
                              ? "border-green-400 bg-green-50 text-green-800"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {o.option_text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => deleteQuestion(q.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Add new question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add question</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label htmlFor="points" className="mb-1.5 block">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qtext">Question text</Label>
            <Textarea
              id="qtext"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your question here…"
              rows={2}
            />
          </div>

          {/* Options */}
          {newType !== "short_text" ? (
            <div className="flex flex-col gap-2">
              <Label>Answer options</Label>
              {newOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(idx)}
                    title={opt.is_correct ? "Correct" : "Mark as correct"}
                    className={`w-5 h-5 rounded border flex-shrink-0 ${
                      opt.is_correct ? "bg-green-500 border-green-500" : "border-border"
                    }`}
                  />
                  <Input
                    value={opt.option_text}
                    onChange={(e) => updateOption(idx, "option_text", e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    disabled={newType === "true_false"}
                  />
                  {newType !== "true_false" && newOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewOptions((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              {newType !== "true_false" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setNewOptions((prev) => [...prev, { option_text: "", is_correct: false }])}
                >
                  + Add option
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Correct answer (exact match)</Label>
              <Input
                value={newOptions[0]?.option_text ?? ""}
                onChange={(e) => setNewOptions([{ option_text: e.target.value, is_correct: true }])}
                placeholder="e.g. photosynthesis"
              />
            </div>
          )}

          <Button onClick={addQuestion} disabled={addingQuestion}>
            {addingQuestion ? "Adding…" : "Add question"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
