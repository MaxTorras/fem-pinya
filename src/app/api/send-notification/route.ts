// src/app/api/send-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Supabase server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// VAPID keys
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

    // Fetch subscriptions from Supabase
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0)
      return NextResponse.json({ success: false, error: "No subscriptions found" }, { status: 400 });

    const payload = JSON.stringify({ title, body: message, url });

await Promise.all(
  subscriptions.map(async (sub) => {
    try {
      const keys = typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys;
      if (!sub.endpoint || !keys?.p256dh || !keys?.auth) return;

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
        payload
      );
    } catch (err: any) {
      console.error("Failed to send notification:", err.statusCode || err.message || err);

      // Remove stale subscriptions (410 Gone or 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
        console.log("Deleted stale subscription:", sub.id);
      }
    }
  })
);



    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
