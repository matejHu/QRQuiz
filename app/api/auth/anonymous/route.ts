import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { display_name } = await request.json();

  if (!display_name || typeof display_name !== "string" || display_name.trim().length < 1) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("anonymous_students")
    .insert({ display_name: display_name.trim() })
    .select("id, display_name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
