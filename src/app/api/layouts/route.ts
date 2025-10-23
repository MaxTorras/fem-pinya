// src/app/api/layouts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("layouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET layouts error:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
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
  } catch (err) {
    console.error("POST layout error:", err);
    return NextResponse.json({ success: false, error: "Failed to save layout" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false }, { status: 400 });

    const { error } = await supabase.from("layouts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE layout error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete layout" }, { status: 500 });
  }
}
