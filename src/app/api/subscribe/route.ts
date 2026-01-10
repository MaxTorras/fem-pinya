import { NextRequest, NextResponse } from "next/server";

// You can store subscriptions in a database; for now, we use an in-memory array (not persistent)
let subscriptions: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    // Avoid duplicate subscriptions
    const exists = subscriptions.find(
      (sub) => JSON.stringify(sub) === JSON.stringify(subscription)
    );
    if (!exists) subscriptions.push(subscription);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Optional: API to list subscriptions for testing
export async function GET() {
  return NextResponse.json({ subscriptions });
}
