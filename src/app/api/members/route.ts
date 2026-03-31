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

// ✅ Normalizer (NEW)
const normalizeNicknameForCompare = (value: string) =>
  value
    .replace(/\u00A0/g, " ")   // Google Sheets NBSP
    .replace(/\s+/g, " ")     // collapse whitespace
    .trim()
    .toLowerCase();



export async function GET() {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:K";

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const members = rows.map(
      ([
        nickname,
        passwordHash,
        name,
        surname,
        position,
        position2,
        isAdmin,
        colla,
        collaColor,
        profilePictureUrl,
        parent
      ]) => ({
        nickname,
        passwordHash,
        name,
        surname,
        position: position || null,
        position2: position2 || null,
        isAdmin: isAdmin?.toLowerCase() === "yes",
        colla: colla || null,
        collaColor: collaColor || null,
        profilePictureUrl: profilePictureUrl || null,
        parent: parent || null, // 👈 THIS IS THE KEY
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
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }

    // ✅ Normalize nickname (NEW)
   const normalizedForCompare = normalizeNicknameForCompare(nickname);

    // ✅ Check for existing member (NEW)
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Members!A2:A",
    });

    const rows = existing.data.values || [];

    const memberExists = rows.some(
      ([existingNickname]) =>
        normalizeNicknameForCompare(existingNickname || "") ===
        normalizedForCompare
    );

    if (memberExists) {
      return NextResponse.json(
        { error: "Member already exists" },
        { status: 409 }
      );
    }
        // ✨ Store nickname with original casing (only trimmed)
    const storedNickname = nickname.replace(/\u00A0/g, " ").trim();

    // ✅ Append using normalized nickname (CHANGED)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Members!A2:K",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            storedNickname,
            passwordHash,
            "",
            "",
            position,
            position2,
            "",
            colla,
            collaColor,
          ],
        ],
      },
    });

    return NextResponse.json({
      success: true,
      member: {
        nickname: storedNickname,
        passwordHash,
        position,
        colla,
        collaColor,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
