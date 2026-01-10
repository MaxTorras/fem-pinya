import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPID_KEY!;

webpush.setVapidDetails(
  "mailto:youremail@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
  try {
    const { title, message, url } = await req.json();

    const notificationPayload = JSON.stringify({ title, body: message, url });

    // Fetch all subscriptions from Supabase
    const { data: subscriptions } = await supabase.from("push_subscriptions").select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub.subscription, notificationPayload);
          return { success: true };
        } catch (err: unknown) {
          console.error("Failed to send notification:", err);
          return { success: false, error: (err as Error).message || String(err) };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
