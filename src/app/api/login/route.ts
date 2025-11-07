import { NextResponse } from "next/server";
import { google } from "googleapis";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { nickname, password } = await request.json();

  if (!nickname || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // 1️⃣ Authorize Google Sheets (no GOOGLE_TYPE needed)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 2️⃣ Fetch Members sheet
    const spreadsheetId = process.env.GOOGLE_SHEET_ID; // your Attendance spreadsheet ID
    const range = "members!A:F"; // nickname | passwordHash | name | surname | position | position2

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];

    // 3️⃣ Find the user
    const user = rows.find((row) => row[0]?.toLowerCase() === nickname.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = user[1];
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 4️⃣ Return session token
    const token = Buffer.from(`${nickname}-${Date.now()}`).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      nickname: user[0],
      name: user[2],
      surname: user[3],
      position: user[4],
      position2: user[5],
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
