import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.NEXT_PRIVATE_VAPID_KEY!;

// Configure web-push
webpush.setVapidDetails(
  "mailto:youremail@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// For demo purposes, we use the same in-memory subscriptions array
// In production, load subscriptions from a database
let subscriptions: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const { title, message } = await req.json();

    const notificationPayload = JSON.stringify({ title, message });

    const results = await Promise.all(
  subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, notificationPayload);
      return { success: true };
    } catch (err: unknown) {           // ✅ explicitly type err as unknown
      console.error("Failed to send notification to subscription:", err);
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
