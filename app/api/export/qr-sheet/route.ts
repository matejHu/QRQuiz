import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question_ids } = await request.json();
  if (!Array.isArray(question_ids) || question_ids.length === 0) {
    return NextResponse.json({ error: "question_ids array is required." }, { status: 400 });
  }

  const serviceClient = await createServiceClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const results = await Promise.all(
    question_ids.map(async (questionId: string) => {
      // Find or create a static QR code for this question
      const { data: existing } = await serviceClient
        .from("qr_codes")
        .select("id, label")
        .eq("locked_question_id", questionId)
        .eq("type", "static")
        .eq("creator_id", user.id)
        .limit(1)
        .single();

      let qrId: string;
      let label: string;

      if (existing) {
        qrId = existing.id;
        label = existing.label;
      } else {
        // Fetch question text for label
        const { data: question } = await serviceClient
          .from("questions")
          .select("question_text")
          .eq("id", questionId)
          .single();

        const questionLabel = question?.question_text?.slice(0, 50) ?? "Question";

        const { data: created } = await serviceClient
          .from("qr_codes")
          .insert({
            type: "static",
            label: questionLabel,
            creator_id: user.id,
            locked_question_id: questionId,
          })
          .select("id, label")
          .single();

        qrId = created!.id;
        label = created!.label;
      }

      const url = `${baseUrl}/quiz/${qrId}`;
      const qrImageBase64 = await QRCode.toDataURL(url, { width: 200, margin: 1 });

      // Fetch question text for display
      const { data: question } = await serviceClient
        .from("questions")
        .select("question_text, type, points")
        .eq("id", questionId)
        .single();

      return {
        question_id: questionId,
        qr_code_id: qrId,
        label,
        question_text: question?.question_text ?? "",
        question_type: question?.type ?? "",
        points: question?.points ?? 0,
        url,
        qr_image_base64: qrImageBase64,
      };
    })
  );

  return NextResponse.json(results);
}
