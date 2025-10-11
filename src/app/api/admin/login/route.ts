import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Replace with your admin password (or fetch from ENV)
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Login successful" });
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
