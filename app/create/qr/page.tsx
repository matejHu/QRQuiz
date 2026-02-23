"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Suspense } from "react";

interface Quiz { id: string; title: string; }
interface Question { id: string; question_text: string; quiz_id: string; }
interface QuizWithQ extends Quiz { questions: Question[]; }

function NewQrForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedQuiz = searchParams.get("quiz") ?? "";

  const [label, setLabel] = useState("");
  const [locationDesc, setLocationDesc] = useState("");
  const [quizList, setQuizList] = useState<QuizWithQ[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState(preselectedQuiz);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((data: Quiz[]) => {
        // Fetch questions for each quiz
        return Promise.all(
          data.map(async (q) => {
            const res = await fetch(`/api/quizzes/${q.id}`);
            const full = await res.json();
            return { ...q, questions: full.questions ?? [] };
          })
        );
      })
      .then(setQuizList);
  }, []);

  const allQuestions = quizList.flatMap((q) =>
    q.questions.map((qu: Question) => ({ ...qu, quizTitle: q.title }))
  );

  async function createDynamic(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    const res = await fetch("/api/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "dynamic",
        label,
        location_description: locationDesc,
        current_quiz_id: selectedQuizId || null,
      }),
    });
    if (!res.ok) { toast.error("Failed to create QR code."); setLoading(false); return; }
    const data = await res.json();
    toast.success("QR code created!");
    router.push(`/create/qr/${data.id}`);
  }

  async function createStatic(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !selectedQuestionId) {
      toast.error("Label and question are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "static",
        label,
        location_description: locationDesc,
        locked_question_id: selectedQuestionId,
      }),
    });
    if (!res.ok) { toast.error("Failed to create QR code."); setLoading(false); return; }
    const data = await res.json();
    toast.success("Static QR code created!");
    router.push(`/create/qr/${data.id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">New QR code</h1>

      <Tabs defaultValue="dynamic">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="dynamic" className="flex-1">Dynamic</TabsTrigger>
          <TabsTrigger value="static" className="flex-1">Static (locked)</TabsTrigger>
        </TabsList>

        <TabsContent value="dynamic">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dynamic QR code</CardTitle>
              <p className="text-sm text-muted-foreground">
                Linked to a location. You can change the quiz at any time.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={createDynamic} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="label-d">Label *</Label>
                  <Input id="label-d" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Classroom B12 door" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="loc-d">Location description</Label>
                  <Input id="loc-d" value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} placeholder="Optional details…" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Assign quiz now (optional)</Label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger><SelectValue placeholder="Assign later…" /></SelectTrigger>
                    <SelectContent>
                      {quizList.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create dynamic QR"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Static QR code</CardTitle>
              <p className="text-sm text-muted-foreground">
                Permanently locked to one question. Cannot be changed after creation.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={createStatic} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="label-s">Label *</Label>
                  <Input id="label-s" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Biology Q3" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="loc-s">Location description</Label>
                  <Input id="loc-s" value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} placeholder="Optional details…" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Question *</Label>
                  <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                    <SelectTrigger><SelectValue placeholder="Select question…" /></SelectTrigger>
                    <SelectContent>
                      {allQuestions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          [{q.quizTitle}] {q.question_text.slice(0, 60)}{q.question_text.length > 60 ? "…" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create static QR"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewQrPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <NewQrForm />
    </Suspense>
  );
}
