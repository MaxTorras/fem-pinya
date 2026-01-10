// src/app/api/send-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { subscriptions } from "@/lib/subscriptions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPID_KEY!;

// Configure web-push
webpush.setVapidDetails(
  "mailto:you@domain.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(req: NextRequest) {
  try {
    const { title, message } = await req.json();
    const payload = JSON.stringify({ title, body: message, url: "/" });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
          return { success: true };
        } catch (err: unknown) {
          console.error("Failed to send notification:", err);
          return { success: false, error: (err as Error).message || String(err) };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
