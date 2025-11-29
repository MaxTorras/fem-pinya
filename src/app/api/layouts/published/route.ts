// src/app/api/layouts/published/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_request: Request) {
  try {
    // Return all layouts that have "GLOBAL" in published_dates
    const { data, error } = await supabase
      .from("layouts")
      .select("*")
      .contains("published_dates", ["GLOBAL"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ layouts: data ?? [] });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("GET /api/layouts/published error:", err.message);
      return NextResponse.json(
        { layouts: [], error: err.message },
        { status: 500 }
      );
    }
    console.error("GET /api/layouts/published unknown error:", err);
    return NextResponse.json(
      { layouts: [], error: "Unknown error" },
      { status: 500 }
    );
  }
}
