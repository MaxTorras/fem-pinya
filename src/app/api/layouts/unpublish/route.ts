import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { layoutIds } = await req.json();

    if (!layoutIds || !Array.isArray(layoutIds)) {
      return new Response(JSON.stringify({ error: "Missing layoutIds" }), { status: 400 });
    }

    // For each layout, clear published_dates completely
    for (const layoutId of layoutIds) {
      const { error: updateError } = await supabase
        .from("layouts")
        .update({ published_dates: [] })
        .eq("id", layoutId);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      console.error("POST /api/layouts/unpublish failed:", err.message);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
    console.error("POST /api/layouts/unpublish failed:", err);
    return new Response(JSON.stringify({ error: "Unknown error" }), { status: 500 });
  }
}
