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

const SHEET_RANGE = "Members!A2:G"; // Nickname, PasswordHash, Name, Surname, Position, Position2, isAdmin

type PositionRow = {
  nickname: string;
  name?: string;
  surname?: string;
  position?: string | null;
  position2?: string | null;
};

export async function GET() {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: SHEET_RANGE,
    });

    const rows = result.data.values || [];

    const positions: PositionRow[] = rows.map(
      ([nickname, _passwordHash, name, surname, position, position2]) => ({
        nickname,
        name: name || "",
        surname: surname || "",
        position: position || "",
        position2: position2 || "",
      })
    );

    return NextResponse.json({ positions });
  } catch (err) {
    console.error("GET /api/positions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const body = await req.json();

    const positions: PositionRow[] = body.positions;

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "Invalid payload: positions must be an array" },
        { status: 400 }
      );
    }

    // 1) Read current nicknames so we know which row to update
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: SHEET_RANGE,
    });

    const rows = current.data.values || [];

    // Map nickname -> row index (0-based from A2)
    const nicknameToRowIndex = new Map<string, number>();
    rows.forEach((row, idx) => {
      const nickname = (row[0] || "").toString();
      if (nickname) {
        nicknameToRowIndex.set(nickname.toLowerCase(), idx);
      }
    });

    // 2) Build batch updates for Position (col E) and Position2 (col F)
    const data: {
      range: string;
      values: (string | null)[][];
    }[] = [];

    positions.forEach((p) => {
      if (!p.nickname) return;

      const rowIndex = nicknameToRowIndex.get(p.nickname.toLowerCase());
      if (rowIndex === undefined) {
        // nickname not found, just skip
        return;
      }

      // Rows start at 2 (A2 = row 2), so add 2 to index
      const rowNumber = rowIndex + 2;

      const positionValue = p.position ?? "";
      const position2Value = p.position2 ?? "";

      data.push({
        range: `Members!E${rowNumber}:F${rowNumber}`,
        values: [[positionValue, position2Value]],
      });
    });

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matching nicknames to update",
      });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: "RAW",
        data,
      },
    });

    return NextResponse.json({ success: true, updated: data.length });
  } catch (err) {
    console.error("PUT /api/positions error:", err);
    return NextResponse.json(
      { error: "Failed to update positions" },
      { status: 500 }
    );
  }
}
