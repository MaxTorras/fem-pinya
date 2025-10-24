// src/app/api/layouts/publish/route.ts
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { layoutIds, date } = await req.json();

    if (!layoutIds || !Array.isArray(layoutIds) || !date) {
      return new Response(JSON.stringify({ error: "Missing layoutIds or date" }), { status: 400 });
    }

    for (const layoutId of layoutIds) {
      // Fetch current published_dates
      const { data: existing, error: fetchError } = await supabase
        .from("layouts")
        .select("published_dates")
        .eq("id", layoutId)
        .single();

      if (fetchError) throw fetchError;

      // Ensure uniqueness
      const [day, month, year] = date.split("-");
const isoDate = `${year}-${month}-${day}`; // "2025-10-21"

const updatedDates = Array.isArray(existing?.published_dates)
  ? Array.from(new Set([...existing.published_dates, isoDate]))
  : [isoDate];


      // Update the layout
      const { error: updateError } = await supabase
        .from("layouts")
        .update({ published_dates: updatedDates })
        .eq("id", layoutId);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
  if (err instanceof Error) {
    console.error("POST /api/layouts/publish failed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
  console.error("POST /api/layouts/publish failed:", err);
  return new Response(JSON.stringify({ error: "Unknown error" }), { status: 500 });
}

}
