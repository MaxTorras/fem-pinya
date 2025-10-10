import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nickname, password }: { nickname: string; password: string } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "Missing nickname or password" }, { status: 400 });
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:B";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows: string[][] = result.data.values || [];
    const member = rows.find((r) => r[0]?.toLowerCase() === nickname.toLowerCase());

    if (!member) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [name, hash] = member;
    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ nickname: name });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", details: message }, { status: 500 });
  }
}
