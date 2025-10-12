import { NextResponse } from "next/server";
import { google } from "googleapis";

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

    // Format date DD-MM-YYYY
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

