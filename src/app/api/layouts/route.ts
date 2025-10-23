// app/api/layouts/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { PinyaLayout } from "@/types/pinya";

const dataFile = path.join(process.cwd(), "data", "layouts.json");

// GET — list all layouts
export async function GET() {
  try {
    const file = await fs.readFile(dataFile, "utf-8").catch(() => "[]");
    const layouts: PinyaLayout[] = JSON.parse(file);

    // Ensure folder field exists
    const safeLayouts = layouts.map(l => ({
      ...l,
      folder: l.folder || undefined,
    }));

    return NextResponse.json(safeLayouts);
  } catch (err) {
    console.error("GET layouts error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST — save new layout
export async function POST(request: Request) {
  try {
    const newLayout: Partial<PinyaLayout> = await request.json();
    if (!newLayout.name || !newLayout.positions) {
      return NextResponse.json({ success: false, error: "Invalid layout" }, { status: 400 });
    }

    const file = await fs.readFile(dataFile, "utf-8").catch(() => "[]");
    const layouts: PinyaLayout[] = JSON.parse(file);

    const layoutToSave: PinyaLayout = {
      id: newLayout.id || Date.now().toString(),
      name: newLayout.name,
      folder: newLayout.folder || undefined,
      castellType: newLayout.castellType || "4d7",
      positions: newLayout.positions,
    };

    layouts.push(layoutToSave);
    await fs.writeFile(dataFile, JSON.stringify(layouts, null, 2));

    return NextResponse.json({ success: true, layout: layoutToSave });
  } catch (err) {
    console.error("POST layout error:", err);
    return NextResponse.json({ success: false, error: "Failed to save layout" }, { status: 500 });
  }
}

// DELETE — delete one layout or all
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const file = await fs.readFile(dataFile, "utf-8").catch(() => "[]");
    let layouts: PinyaLayout[] = JSON.parse(file);

    if (id) {
      layouts = layouts.filter(l => l.id !== id);
    } else {
      layouts = [];
    }

    await fs.writeFile(dataFile, JSON.stringify(layouts, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE layout error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete layout" }, { status: 500 });
  }
}
