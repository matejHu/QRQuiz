"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { NicknameModal } from "@/components/quiz/NicknameModal";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { MultipleChoiceQuestion } from "@/components/questions/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/questions/TrueFalseQuestion";
import { ShortTextQuestion } from "@/components/questions/ShortTextQuestion";
import { MultipleSelectQuestion } from "@/components/questions/MultipleSelectQuestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnonymousStudent } from "@/hooks/useAnonymousStudent";
import { toast } from "sonner";

interface Option {
  id: string;
  option_text: string;
}

interface Question {
  id: string;
  question_text: string;
  type: "multiple_choice" | "true_false" | "short_text" | "multiple_select";
  points: number;
  order_index: number;
  question_options: Option[];
}

interface QuizData {
  mode: "dynamic" | "static";
  qr_code_id: string;
  quiz?: {
    id: string;
    title: string;
    description: string | null;
    time_limit_seconds: number | null;
    questions: Question[];
  };
  question?: Question;
  status?: "inactive" | "empty";
}

export default function QuizPage() {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const router = useRouter();
  const { student, loading: studentLoading, createStudent } = useAnonymousStudent();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${qrCodeId}`)
      .then((r) => r.json())
      .then(setQuizData)
      .catch(() => setFetchError("Could not load the quiz."));
  }, [qrCodeId]);

  useEffect(() => {
    if (!studentLoading && !student && quizData && !quizData.status) {
      setShowNickname(true);
    }
  }, [studentLoading, student, quizData]);

  const handleTimeUp = useCallback(() => {
    setTimedOut(true);
    toast.warning("Time's up! Submitting your answers.");
  }, []);

  useEffect(() => {
    if (timedOut) {
      submitAnswers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  async function handleNicknameConfirm(name: string) {
    const created = await createStudent(name);
    if (!created) {
      toast.error("Could not save nickname. Please try again.");
      return;
    }
    setShowNickname(false);
  }

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function submitAnswers() {
    if (submitting) return;
    if (!student) {
      setShowNickname(true);
      return;
    }
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const res = await fetch(`/api/quiz/${qrCodeId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        anonymous_id: student.id,
        time_taken_seconds: timeTaken,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to submit quiz.");
      setSubmitting(false);
      return;
    }
    const result = await res.json();
    router.push(
      `/quiz/${qrCodeId}/result?score=${result.score}&max=${result.max_score}&pct=${result.percentage}`
    );
  }

  if (fetchError) {
    return (
      <div className="flex justify-center pt-16">
        <p className="text-muted-foreground">{fetchError}</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="flex justify-center pt-16">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (quizData.status === "inactive") {
    return (
      <div className="flex justify-center pt-16">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-6 pb-6 flex flex-col gap-2">
            <p className="font-medium">This QR code is currently inactive.</p>
            <p className="text-sm text-muted-foreground">Check back later!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizData.status === "empty") {
    return (
      <div className="flex justify-center pt-16">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-6 pb-6 flex flex-col gap-2">
            <p className="font-medium">No quiz assigned yet.</p>
            <p className="text-sm text-muted-foreground">The creator hasn&apos;t added content here yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions: Question[] =
    quizData.mode === "static"
      ? quizData.question
        ? [quizData.question]
        : []
      : quizData.quiz?.questions ?? [];

  const title =
    quizData.mode === "static"
      ? "Question"
      : (quizData.quiz?.title ?? "Quiz");

  const timeLimit =
    quizData.mode === "dynamic" ? (quizData.quiz?.time_limit_seconds ?? null) : null;

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== "" && !(Array.isArray(a) && a.length === 0);
  }).length;

  return (
    <>
      <NicknameModal open={showNickname} onConfirm={handleNicknameConfirm} />

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {quizData.mode === "dynamic" && quizData.quiz?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {quizData.quiz.description}
              </p>
            )}
          </div>
          {timeLimit && !timedOut && (
            <QuizTimer totalSeconds={timeLimit} onTimeUp={handleTimeUp} />
          )}
        </div>

        {questions.length > 1 && (
          <QuizProgress current={answeredCount} total={questions.length} />
        )}

        {/* Questions */}
        {questions.map((question, idx) => (
          <Card key={question.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Question {idx + 1}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {question.points} pt{question.points !== 1 ? "s" : ""}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {question.type === "multiple_choice" && (
                <MultipleChoiceQuestion
                  questionText={question.question_text}
                  options={question.question_options}
                  selected={(answers[question.id] as string) ?? ""}
                  onChange={(v) => setAnswer(question.id, v)}
                />
              )}
              {question.type === "true_false" && (
                <TrueFalseQuestion
                  questionText={question.question_text}
                  options={question.question_options}
                  selected={(answers[question.id] as string) ?? ""}
                  onChange={(v) => setAnswer(question.id, v)}
                />
              )}
              {question.type === "short_text" && (
                <ShortTextQuestion
                  questionText={question.question_text}
                  value={(answers[question.id] as string) ?? ""}
                  onChange={(v) => setAnswer(question.id, v)}
                />
              )}
              {question.type === "multiple_select" && (
                <MultipleSelectQuestion
                  questionText={question.question_text}
                  options={question.question_options}
                  selected={(answers[question.id] as string[]) ?? []}
                  onChange={(v) => setAnswer(question.id, v)}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Button
          size="lg"
          onClick={submitAnswers}
          disabled={submitting || !student}
          className="w-full"
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </Button>
      </div>
    </>
  );
}
