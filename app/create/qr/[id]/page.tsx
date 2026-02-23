"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Quiz { id: string; title: string; }
interface QrData {
  id: string;
  type: "dynamic" | "static";
  label: string;
  location_description: string | null;
  current_quiz_id: string | null;
  locked_question_id: string | null;
  is_active: boolean;
  quizzes?: Quiz | null;
  questions?: { id: string; question_text: string } | null;
  qr_code_assignments?: Array<{
    id: string;
    quiz_id: string;
    active_from: string;
    active_until: string | null;
    notes: string | null;
    quizzes?: { title: string } | null;
  }>;
}

export default function ManageQrPage() {
  const { id } = useParams<{ id: string }>();
  const [qr, setQr] = useState<QrData | null>(null);
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [qrImage, setQrImage] = useState<string>("");

  // Assign form
  const [assignQuizId, setAssignQuizId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Schedule form
  const [scheduleQuizId, setScheduleQuizId] = useState("");
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleUntil, setScheduleUntil] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL ?? "";

  const fetchQr = useCallback(async () => {
    const res = await fetch(`/api/qr-codes/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setQr(data);
    // Generate QR image
    const url = `${baseUrl}/quiz/${id}`;
    const img = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrImage(img);
  }, [id, baseUrl]);

  useEffect(() => {
    fetchQr();
    fetch("/api/quizzes").then((r) => r.json()).then(setQuizList);
  }, [fetchQr]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignQuizId) { toast.error("Select a quiz."); return; }
    setAssigning(true);
    const res = await fetch(`/api/qr-codes/${id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: assignQuizId, notes: assignNotes }),
    });
    if (res.ok) {
      toast.success("Quiz assigned!");
      setAssignNotes("");
      await fetchQr();
    } else {
      toast.error("Failed to assign quiz.");
    }
    setAssigning(false);
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleQuizId || !scheduleFrom) { toast.error("Quiz and start date are required."); return; }
    setScheduling(true);
    const res = await fetch(`/api/qr-codes/${id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quiz_id: scheduleQuizId,
        active_from: scheduleFrom,
        active_until: scheduleUntil || null,
        notes: scheduleNotes,
      }),
    });
    if (res.ok) {
      toast.success("Scheduled!");
      setScheduleFrom(""); setScheduleUntil(""); setScheduleNotes("");
      await fetchQr();
    } else {
      toast.error("Failed to schedule.");
    }
    setScheduling(false);
  }

  function downloadQr() {
    const a = document.createElement("a");
    a.href = qrImage;
    a.download = `qr-${qr?.label ?? id}.png`;
    a.click();
  }

  if (!qr) return <p className="text-muted-foreground">Loading…</p>;

  const quizUrl = `${baseUrl}/quiz/${id}`;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{qr.label}</h1>
          {qr.location_description && (
            <p className="text-sm text-muted-foreground mt-0.5">{qr.location_description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={qr.type === "static" ? "secondary" : "default"}>
            {qr.type}
          </Badge>
          <Link href="/create">
            <Button variant="ghost" size="sm">Back</Button>
          </Link>
        </div>
      </div>

      {/* QR Code image */}
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          {qrImage && (
            <img src={qrImage} alt="QR Code" className="w-48 h-48 rounded" />
          )}
          <p className="text-xs text-muted-foreground break-all text-center">{quizUrl}</p>
          <Button onClick={downloadQr} variant="outline">Download PNG</Button>
        </CardContent>
      </Card>

      {/* Current assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current content</CardTitle>
        </CardHeader>
        <CardContent>
          {qr.type === "static" ? (
            <div className="text-sm">
              <Badge variant="outline" className="mb-2">Locked — cannot be changed</Badge>
              <p className="font-medium">{qr.questions?.question_text ?? "—"}</p>
            </div>
          ) : (
            <p className="text-sm">
              {qr.quizzes
                ? <><span className="font-medium">{qr.quizzes.title}</span></>
                : <span className="text-muted-foreground">No quiz assigned</span>
              }
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assign quiz (dynamic only) */}
      {qr.type === "dynamic" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assign quiz now</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quiz</Label>
                <Select value={assignQuizId} onValueChange={setAssignQuizId}>
                  <SelectTrigger><SelectValue placeholder="Select quiz…" /></SelectTrigger>
                  <SelectContent>
                    {quizList.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes (optional)</Label>
                <Input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="e.g. Spring quiz" />
              </div>
              <Button type="submit" disabled={assigning}>
                {assigning ? "Assigning…" : "Assign quiz"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Schedule (dynamic only) */}
      {qr.type === "dynamic" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule future quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchedule} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quiz</Label>
                <Select value={scheduleQuizId} onValueChange={setScheduleQuizId}>
                  <SelectTrigger><SelectValue placeholder="Select quiz…" /></SelectTrigger>
                  <SelectContent>
                    {quizList.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Active from</Label>
                  <Input type="datetime-local" value={scheduleFrom} onChange={(e) => setScheduleFrom(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Active until (optional)</Label>
                  <Input type="datetime-local" value={scheduleUntil} onChange={(e) => setScheduleUntil(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes</Label>
                <Input value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="e.g. Christmas quiz" />
              </div>
              <Button type="submit" disabled={scheduling}>
                {scheduling ? "Scheduling…" : "Schedule"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assignment history */}
      {qr.type === "dynamic" && qr.qr_code_assignments && qr.qr_code_assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {qr.qr_code_assignments.map((a) => (
                <div key={a.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{a.quizzes?.title ?? "—"}</span>
                    {a.notes && <span className="text-muted-foreground ml-2">· {a.notes}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.active_from).toLocaleDateString()}
                    {a.active_until ? ` → ${new Date(a.active_until).toLocaleDateString()}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground text-center">
        QR code UUID: <code className="font-mono">{id}</code>
      </p>
    </div>
  );
}
