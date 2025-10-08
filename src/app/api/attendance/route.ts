import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const { memberNickname, date } = await req.json();
    if (!memberNickname || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // JWT auth
   const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

    const sheets = google.sheets({ version: "v4", auth });

    // 1️⃣ Fetch existing members
    const membersSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "members!A:A",
    });

    const existingMembers: string[] = membersSheet.data.values?.flat() || [];

    // 2️⃣ If new member, add to Members sheet
    if (!existingMembers.includes(memberNickname)) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "members!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [[memberNickname]] },
      });
    }

    // 3️⃣ Format date DD-MM-YYYY
    const jsDate = new Date(date);
    const formattedDate = `${String(jsDate.getDate()).padStart(2, "0")}-${String(
      jsDate.getMonth() + 1
    ).padStart(2, "0")}-${jsDate.getFullYear()}`;

    // 4️⃣ Append check-in to Sheet1
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "attendance!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[formattedDate, memberNickname, new Date().toISOString()]] },
    });

    return NextResponse.json({ message: "Attendance recorded" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error saving attendance" }, { status: 500 });
  }
}
