// src/app/api/layouts/publish/route.ts
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { layoutIds } = await req.json();

    if (!layoutIds || !Array.isArray(layoutIds) || layoutIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing layoutIds" }), {
        status: 400,
      });
    }

    for (const layoutId of layoutIds) {
      // Get current published_dates
      const { data: existing, error: fetchError } = await supabase
        .from("layouts")
        .select("published_dates")
        .eq("id", layoutId)
        .single();

      if (fetchError) throw fetchError;

      const currentDates = Array.isArray(existing?.published_dates)
        ? (existing.published_dates as string[])
        : [];

      // Use a sentinel value "GLOBAL" to mean "published long term"
      const updatedDates = Array.from(new Set([...currentDates, "GLOBAL"]));

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
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }
    console.error("POST /api/layouts/publish failed:", err);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
    });
  }
}
