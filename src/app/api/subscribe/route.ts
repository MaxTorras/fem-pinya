import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    // Avoid duplicates
    const { data: exists } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("endpoint", subscription.endpoint)
      .single();

    if (!exists) {
      await supabase.from("push_subscriptions").insert([subscription]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
