// src/app/api/members/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    const range = "Members!A2:E"; // <-- Added E for Position

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const members = rows.map(([nickname, passwordHash, name, surname, position]) => ({
      nickname,
      passwordHash,
      name,
      surname,
      position: position || "Unknown",
    }));

    return NextResponse.json({ members });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
