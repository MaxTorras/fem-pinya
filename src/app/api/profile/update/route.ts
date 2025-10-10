import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { oldNickname, newNickname, name, surname, oldPassword, newPassword } =
      await req.json();

    if (!oldNickname) return NextResponse.json({ error: "Missing nickname" }, { status: 400 });

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:D"; // includes nickname, password, name, surname

    // Fetch members
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(
      (r) => r[0]?.toLowerCase() === oldNickname.toLowerCase()
    );

    if (rowIndex === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentRow = rows[rowIndex];
    let [currentNickname, currentHash, currentName, currentSurname] = currentRow;

    // Password change
    if (oldPassword && newPassword) {
      const match = await bcrypt.compare(oldPassword, currentHash);
      if (!match) return NextResponse.json({ error: "Old password incorrect" }, { status: 401 });
      currentHash = await bcrypt.hash(newPassword, 10);
    }

    // Prepare updated row
    const updatedRow = [
      newNickname || currentNickname,
      currentHash,
      name || currentName || "",
      surname || currentSurname || "",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Members!A${rowIndex + 2}:D${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [updatedRow] },
    });

    return NextResponse.json({ message: "Profile updated!" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
