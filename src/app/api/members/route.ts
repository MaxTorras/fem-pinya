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
    const range = "Members!A2:I"; // Expand range to include colla and collaColor

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const members = rows.map(
      (
        [
          nickname,
          passwordHash,
          name,
          surname,
          position,
          position2,
          isAdmin,
          colla,       // new column H
          collaColor,  // new column I
        ]
      ) => ({
        nickname,
        passwordHash,
        name,
        surname,
        position: position || null,
        position2: position2 || null,
        isAdmin: isAdmin?.toLowerCase() === "yes",
        colla: colla || null,
        collaColor: collaColor || null,
        missingPosition: !position,
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

    const {
      nickname,
      passwordHash = "",
      position = "New",
      position2 = "",
      colla = "",
      collaColor = "",
    } = data;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname is required" }, { status: 400 });
    }

    // Append to Members sheet: fill A (nickname), B (passwordHash), C/D empty, E (position), F (position2), H/I colla info
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Members!A2:I",
      valueInputOption: "RAW",
      requestBody: {
        values: [[nickname, passwordHash, "", "", position, position2, "", colla, collaColor]],
      },
    });

    return NextResponse.json({ success: true, member: { nickname, passwordHash, position, colla, collaColor } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
