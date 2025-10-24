// src/app/api/layouts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { PinyaLayout } from "@/types/pinya";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // optional ?date=YYYY-MM-DD

    let query = supabase.from("layouts").select("*").order("created_at", { ascending: false });

    if (date) {
      query = query.contains("published_dates", [date]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/layouts error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cast to PinyaLayout[] safely
    return NextResponse.json(((data ?? []) as unknown) as PinyaLayout[]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Unexpected /api/layouts error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("Unexpected /api/layouts unknown error:", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newLayout: PinyaLayout = await request.json();

    const { data, error } = await supabase.from("layouts").insert([newLayout]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      layout: (((data ?? []) as unknown) as PinyaLayout[])[0] ?? null,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("POST /api/layouts error:", err.message);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/layouts unknown error:", err);
    return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { error } = await supabase.from("layouts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("DELETE /api/layouts error:", err.message);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
    console.error("DELETE /api/layouts unknown error:", err);
    return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
  }
}
