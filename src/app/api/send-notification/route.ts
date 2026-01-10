import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side only
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPID_KEY!;

webpush.setVapidDetails(
  "mailto:youremail@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
  try {
    const { title, message } = await req.json();

    // Fetch subscriptions from Supabase
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;

    const payload = JSON.stringify({ title, body: message });

    // Send notifications
    await Promise.all(
      subscriptions!.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: JSON.parse(sub.keys) },
            payload
          )
          .catch((err: unknown) => {
            console.error("Failed:", (err as Error).message || err);
          })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
