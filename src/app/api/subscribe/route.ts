// src/app/api/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { subscriptions } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
  try {
    const subscription: PushSubscription = await req.json();

    // Avoid duplicates
    const exists = subscriptions.find(
      (sub) => JSON.stringify(sub) === JSON.stringify(subscription)
    );
    if (!exists) subscriptions.push(subscription);

    console.log("New subscription:", subscription);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Optional: list all subscriptions (for testing)
export async function GET() {
  return NextResponse.json({ subscriptions });
}
