// src/app/api/votes/attendance/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch all votes from Supabase
    const { data, error } = await supabase
      .from("votes")
      .select("*"); // id, nickname, eventId, vote, created_at, comment

    if (error) throw error;

    // Return array of vote records
    return NextResponse.json({ records: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}
