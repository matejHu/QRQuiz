import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();

    // Test 1: can we query at all?
    const { error: pingError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (pingError) {
      return NextResponse.json({
        ok: false,
        step: "profiles_select",
        error: pingError.message,
        code: pingError.code,
      }, { status: 500 });
    }

    // Test 2: check enums exist
    const { data: enumCheck, error: enumError } = await supabase
      .rpc("increment_student_points", { student_id: "00000000-0000-0000-0000-000000000000", points_to_add: 0 });

    return NextResponse.json({
      ok: true,
      profiles_table: "reachable",
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      enum_rpc: enumError ? `error: ${enumError.message}` : "ok",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
