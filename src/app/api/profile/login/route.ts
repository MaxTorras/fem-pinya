import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "Missing nickname or password" }, { status: 400 });
    }

    // Google Sheets authentication using JWT
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:B"; // your capitalized Members sheet

    // Fetch all members
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const member = rows.find(
      (r) => r[0]?.toLowerCase() === nickname.toLowerCase()
    );

    if (!member) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [name, hash] = member;
    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // ✅ Login successful — return basic info
    return NextResponse.json({ nickname: name });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
