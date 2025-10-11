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

    // ✅ read from the correct sheet
    const range = "attendance!A2:C"; 

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const records = rows.map(([date, nickname, timestamp]) => ({
      date,
      nickname,
      timestamp,
    }));

    return NextResponse.json({ records });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
