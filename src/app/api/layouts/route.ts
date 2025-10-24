// src/app/api/layouts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // optional ?date=YYYY-MM-DD

    let query = supabase
      .from("layouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (date) {
      // ⚠️ You don’t have a 'date' column — but you have 'published_dates'
      // so we’ll check if the formatted date is inside that array:
      query = query.contains("published_dates", [date]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/layouts error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("Unexpected /api/layouts error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newLayout = await request.json();
    const { data, error } = await supabase.from("layouts").insert([
      {
        id: newLayout.id,
        name: newLayout.name,
        folder: newLayout.folder || null,
        castellType: newLayout.castellType,
        positions: newLayout.positions,
      },
    ]);

    if (error) throw error;
    return NextResponse.json({ success: true, layout: data?.[0] ?? null });
  } catch (err: any) {
    console.error("POST /api/layouts error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { error } = await supabase.from("layouts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/layouts error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
