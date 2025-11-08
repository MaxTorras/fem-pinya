// src/app/api/members/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

async function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:G";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const members = rows.map(
  ([nickname, passwordHash, name, surname, position, position2, isAdmin]) => ({
    nickname,
    passwordHash,
    name,
    surname,
    position: position || null, // keep null if empty
    position2: position2 || null,    // secondary/fallback position
    isAdmin: isAdmin?.toLowerCase() === "yes",
    missingPosition: !position, // true if empty
  })
);

    return NextResponse.json({ members });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// --- NEW POST HANDLER ---
export async function POST(req: Request) {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const data = await req.json();

    const { nickname, passwordHash = "", position = "New", position2 = "" } = data;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname is required" }, { status: 400 });
    }

    // Append to Members sheet: fill A (nickname), B (passwordHash), leave C/D empty, E (position)
   await sheets.spreadsheets.values.append({
  spreadsheetId: sheetId,
  range: "Members!A2:G",
  valueInputOption: "RAW",
  requestBody: {
    values: [[nickname, passwordHash, "", "", position, position2]],
  },
});

    return NextResponse.json({ success: true, member: { nickname, passwordHash, position } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
