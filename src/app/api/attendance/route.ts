import { NextResponse } from "next/server";
import { google } from "googleapis";

// 🟩 Helper to normalize date to DD-MM-YYYY
function normalizeDate(input: string) {
  let day: string, month: string, year: string;

  // Check if input is already in DD-MM-YYYY
  const match = input.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    [ , day, month, year ] = match;
    return `${day}-${month}-${year}`;
  }

  // If input is ISO (YYYY-MM-DD)
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    [ , year, month, day ] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  // Fallback: try creating a Date object
  const jsDate = new Date(input);
  if (isNaN(jsDate.getTime())) throw new Error("Invalid date input");

  const local = new Date(jsDate.toLocaleString("en-GB", { timeZone: "Europe/London" }));
  day = String(local.getDate()).padStart(2, "0");
  month = String(local.getMonth() + 1).padStart(2, "0");
  year = String(local.getFullYear());

  return `${day}-${month}-${year}`;
}

// 🟩 GET — fetch attendance records (optionally filtered by date)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
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

    if (dateParam) {
      const formatted = normalizeDate(dateParam);
      const filtered = records.filter((r) => r.date === formatted);
      return NextResponse.json({ records: filtered });
    }

    return NextResponse.json({ records });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// 🟦 POST — add new attendance record, prevent duplicates
export async function POST(req: Request) {
  try {
    const { memberNickname, date } = await req.json();
    if (!memberNickname || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const formattedDate = normalizeDate(date);

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    // 🛑 Check for duplicates
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "attendance!A2:C",
    });

    const rows = existing.data.values || [];
    const alreadyCheckedIn = rows.some(
      ([d, nickname]) =>
        d?.trim() === formattedDate &&
        nickname?.toLowerCase().trim() === memberNickname.toLowerCase().trim()
    );

    if (alreadyCheckedIn) {
      return NextResponse.json(
        { error: "You’ve already checked in today!" },
        { status: 400 }
      );
    }

    // ✅ Append new attendance record
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "attendance!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[formattedDate, memberNickname.trim(), new Date().toISOString()]],
      },
    });

    return NextResponse.json({ message: "Attendance recorded" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
