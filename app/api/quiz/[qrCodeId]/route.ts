import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ qrCodeId: string }> }
) {
  const { qrCodeId } = await params;
  const supabase = await createServiceClient();

  // Fetch the QR code
  const { data: qr, error: qrError } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qrCodeId)
    .single();

  if (qrError || !qr) {
    return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  }

  if (!qr.is_active) {
    return NextResponse.json({ status: "inactive" }, { status: 200 });
  }

  // STATIC: return the locked question
  if (qr.type === "static") {
    if (!qr.locked_question_id) {
      return NextResponse.json({ status: "empty" }, { status: 200 });
    }

    const { data: question, error: qErr } = await supabase
      .from("questions")
      .select("*, question_options(*)")
      .eq("id", qr.locked_question_id)
      .single();

    if (qErr || !question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    // Sort options
    question.question_options.sort(
      (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
    );

    // Strip correct answer flags before sending to client
    const safeQuestion = {
      ...question,
      question_options: question.question_options.map(
        ({ is_correct: _ic, ...o }: { is_correct: boolean; [key: string]: unknown }) => o
      ),
    };

    return NextResponse.json({
      mode: "static",
      qr_code_id: qr.id,
      question: safeQuestion,
    });
  }

  // DYNAMIC: check for a scheduled assignment that should activate now
  const now = new Date().toISOString();

  // Find a pending scheduled assignment that has become active
  const { data: scheduled } = await supabase
    .from("qr_code_assignments")
    .select("*")
    .eq("qr_code_id", qr.id)
    .lte("active_from", now)
    .or("active_until.is.null,active_until.gte." + now)
    .order("active_from", { ascending: false })
    .limit(1)
    .single();

  // Auto-activate scheduled assignment if different from current
  if (scheduled && scheduled.quiz_id !== qr.current_quiz_id) {
    await supabase
      .from("qr_codes")
      .update({ current_quiz_id: scheduled.quiz_id })
      .eq("id", qr.id);
    qr.current_quiz_id = scheduled.quiz_id;
  }

  if (!qr.current_quiz_id) {
    return NextResponse.json({ status: "empty" }, { status: 200 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*, questions(*, question_options(*))")
    .eq("id", qr.current_quiz_id)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  // Sort questions and options, strip correct flags
  const safeQuiz = {
    ...quiz,
    questions: quiz.questions
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((q: { question_options: Array<{ is_correct: boolean; order_index: number; [key: string]: unknown }>; [key: string]: unknown }) => ({
        ...q,
        question_options: q.question_options
          .sort((a, b) => a.order_index - b.order_index)
          .map(({ is_correct: _ic, ...o }) => o),
      })),
  };

  return NextResponse.json({
    mode: "dynamic",
    qr_code_id: qr.id,
    quiz: safeQuiz,
  });
}
