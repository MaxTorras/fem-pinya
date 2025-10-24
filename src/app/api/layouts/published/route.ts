import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ layouts: [] });
    }
const formattedDate = date; // ✅ keep as YYYY-MM-DD

    const { data, error } = await supabase
      .from("layouts")
      .select("*")
      .contains("published_dates", [formattedDate])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ layouts: data ?? [] });
  } catch (err: any) {
    console.error("GET /api/layouts/published error:", err.message);
    return NextResponse.json({ layouts: [], error: err.message }, { status: 500 });
  }
}
