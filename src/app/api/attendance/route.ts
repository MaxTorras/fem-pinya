import { NextResponse } from "next/server";
import { google } from "googleapis";

// 🟩 GET — fetch attendance records for the admin page
export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "attendance!A2:C"; // A: Date, B: Nickname, C: Timestamp

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

// 🟦 POST — add a new attendance record when someone checks in
export async function POST(req: Request) {
  try {
    const { memberNickname, date } = await req.json();
    if (!memberNickname || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    // Format date as DD-MM-YYYY
    const jsDate = new Date(date);
    const formattedDate = `${String(jsDate.getDate()).padStart(2, "0")}-${String(
      jsDate.getMonth() + 1
    ).padStart(2, "0")}-${jsDate.getFullYear()}`;

    // Append new attendance record
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "attendance!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[formattedDate, memberNickname, new Date().toISOString()]],
      },
    });

    return NextResponse.json({ message: "Attendance recorded" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
