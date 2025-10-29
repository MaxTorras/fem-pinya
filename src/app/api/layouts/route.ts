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

    return NextResponse.json(((data ?? []) as unknown) as PinyaLayout[]);
  } catch (err: unknown) {
    console.error("Unexpected /api/layouts GET error:", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newLayout: PinyaLayout = await request.json();

    // 1️⃣ Check if a layout with same name & folder exists
    const { data: existingLayouts, error: fetchError } = await supabase
      .from("layouts")
      .select("*")
      .eq("name", newLayout.name)
      .eq("folder", newLayout.folder || null)
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingLayouts && existingLayouts.length > 0) {
      // 2️⃣ Update existing layout instead of inserting
      const layoutId = existingLayouts[0].id;
      const { data: updatedData, error: updateError } = await supabase
        .from("layouts")
        .update(newLayout)
        .eq("id", layoutId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: "Layout updated",
        layout: updatedData,
      });
    }

    // 3️⃣ Insert new layout
    const { data, error } = await supabase.from("layouts").insert([newLayout]);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Layout created",
      layout: (((data ?? []) as unknown) as PinyaLayout[])[0] ?? null,
    });
  } catch (err: unknown) {
    console.error("POST /api/layouts error:", err);
    return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedLayout: PinyaLayout = await request.json();
    if (!updatedLayout.id) {
      return NextResponse.json({ success: false, error: "Missing layout ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("layouts")
      .update(updatedLayout)
      .eq("id", updatedLayout.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Layout updated", layout: data });
  } catch (err: unknown) {
    console.error("PUT /api/layouts error:", err);
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
    console.error("DELETE /api/layouts error:", err);
    return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });
  }
}
