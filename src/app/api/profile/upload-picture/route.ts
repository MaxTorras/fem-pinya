// src/app/api/profile/upload-picture/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const nickname = formData.get("nickname") as string;

    if (!file || !nickname) {
      return NextResponse.json({ error: "Missing file or nickname" }, { status: 400 });
    }

    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
  .from("profile-pictures")
  .upload(`${nickname}.jpg`, buffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

if (uploadError) throw uploadError;

// Get public URL
const { data: urlData } = supabase.storage
  .from("profile-pictures")
  .getPublicUrl(`${nickname}.jpg`);

const pictureUrl = urlData.publicUrl; // ✅ correct



    // Update Google Sheet
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    const range = "Members!A2:J"; // J = profilePictureUrl column

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows: string[][] = result.data.values || [];
    const rowIndex = rows.findIndex(r => r[0]?.toLowerCase() === nickname.toLowerCase());

    if (rowIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentRow = rows[rowIndex];
    const updatedRow = [...currentRow];
    updatedRow[9] = pictureUrl; // J column

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Members!A${rowIndex + 2}:J${rowIndex + 2}`,
      valueInputOption: "RAW",
      requestBody: { values: [updatedRow] },
    });

    return NextResponse.json({ message: "Profile picture updated!", url: pictureUrl });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Server error", details: message }, { status: 500 });
  }
}
