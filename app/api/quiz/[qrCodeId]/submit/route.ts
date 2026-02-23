import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface SubmitBody {
  answers: Record<string, string | string[]>;
  anonymous_id?: string;
  user_id?: string;
  time_taken_seconds?: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ qrCodeId: string }> }
) {
  const { qrCodeId } = await params;
  const body: SubmitBody = await request.json();
  const { answers, anonymous_id, user_id, time_taken_seconds } = body;

  if (!anonymous_id && !user_id) {
    return NextResponse.json({ error: "Participant ID required." }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Fetch QR code to determine mode
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("type, current_quiz_id, locked_question_id")
    .eq("id", qrCodeId)
    .single();

  if (!qr) {
    return NextResponse.json({ error: "QR code not found." }, { status: 404 });
  }

  let totalScore = 0;
  let maxScore = 0;
  const questionResults: Array<{
    question_id: string;
    correct: boolean;
    points_earned: number;
    points_max: number;
    correct_options?: string[];
    correct_text?: string;
  }> = [];

  if (qr.type === "static" && qr.locked_question_id) {
    // Score a single question
    const { data: question } = await supabase
      .from("questions")
      .select("*, question_options(*)")
      .eq("id", qr.locked_question_id)
      .single();

    if (question) {
      const result = scoreQuestion(question, answers[question.id]);
      totalScore = result.points_earned;
      maxScore = question.points;
      questionResults.push({ question_id: question.id, ...result });
    }

    await supabase.from("quiz_attempts").insert({
      question_id: qr.locked_question_id,
      qr_code_id: qrCodeId,
      anonymous_id: anonymous_id ?? null,
      user_id: user_id ?? null,
      score: totalScore,
      max_score: maxScore,
      time_taken_seconds: time_taken_seconds ?? null,
      answers,
    });

    if (anonymous_id) {
      await supabase.rpc("increment_student_points", {
        student_id: anonymous_id,
        points_to_add: totalScore,
      });
    }
  } else if (qr.type === "dynamic" && qr.current_quiz_id) {
    // Score a full quiz
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("*, questions(*, question_options(*))")
      .eq("id", qr.current_quiz_id)
      .single();

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    for (const question of quiz.questions) {
      const result = scoreQuestion(question, answers[question.id]);
      totalScore += result.points_earned;
      maxScore += question.points;
      questionResults.push({ question_id: question.id, ...result });
    }

    await supabase.from("quiz_attempts").insert({
      quiz_id: qr.current_quiz_id,
      qr_code_id: qrCodeId,
      anonymous_id: anonymous_id ?? null,
      user_id: user_id ?? null,
      score: totalScore,
      max_score: maxScore,
      time_taken_seconds: time_taken_seconds ?? null,
      answers,
    });

    if (anonymous_id) {
      await supabase.rpc("increment_student_points", {
        student_id: anonymous_id,
        points_to_add: totalScore,
      });
    }
  }

  return NextResponse.json({
    score: totalScore,
    max_score: maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    question_results: questionResults,
  });
}

function scoreQuestion(
  question: {
    id: string;
    type: string;
    points: number;
    question_options: Array<{ id: string; is_correct: boolean; option_text: string }>;
  },
  answer: string | string[] | undefined
) {
  const correctOptions = question.question_options.filter((o) => o.is_correct);
  const correctIds = correctOptions.map((o) => o.id);

  if (answer === undefined || answer === null || answer === "") {
    return {
      correct: false,
      points_earned: 0,
      points_max: question.points,
      correct_options: correctIds,
    };
  }

  if (question.type === "short_text") {
    const correctTexts = correctOptions.map((o) => o.option_text.toLowerCase().trim());
    const userText = (typeof answer === "string" ? answer : answer[0] ?? "").toLowerCase().trim();
    const correct = correctTexts.includes(userText);
    return {
      correct,
      points_earned: correct ? question.points : 0,
      points_max: question.points,
      correct_text: correctOptions[0]?.option_text,
    };
  }

  if (question.type === "multiple_select") {
    const userIds = (Array.isArray(answer) ? answer : [answer]).sort();
    const correct = JSON.stringify(userIds) === JSON.stringify(correctIds.sort());
    return {
      correct,
      points_earned: correct ? question.points : 0,
      points_max: question.points,
      correct_options: correctIds,
    };
  }

  // multiple_choice / true_false — single answer
  const userAnswer = Array.isArray(answer) ? answer[0] : answer;
  const correct = correctIds.includes(userAnswer);
  return {
    correct,
    points_earned: correct ? question.points : 0,
    points_max: question.points,
    correct_options: correctIds,
  };
}
