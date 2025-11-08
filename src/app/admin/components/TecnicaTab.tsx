// src/app/admin/components/TecnicaTab.tsx
"use client";

import { useState } from "react";

type PinyaLayout = { id: string; name: string; folder?: string; publishedDates?: string[] };

export default function TecnicaTab({ layouts }: { layouts: PinyaLayout[] }) {
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);
  const isoDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Tecnica – Select Layouts for Today</h2>

      <div className="flex gap-2 mb-2">
        <button
          onClick={async () => {
            try {
              await fetch("/api/layouts/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: isoDate, layoutIds: selectedLayouts }),
              });

              setSelectedLayouts([]);
              alert("✅ Layouts published for today!");
            } catch (err) {
              console.error(err);
              alert("❌ Failed to publish layouts");
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Publish Selected Layouts
        </button>

        <button
          onClick={async () => {
            try {
              await fetch("/api/layouts/unpublish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ layoutIds: selectedLayouts }),
              });

              setSelectedLayouts([]);
              alert("🗑️ Layouts fully unpublished!");
            } catch (err) {
              console.error(err);
              alert("❌ Failed to unpublish layouts");
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Unpublish Selected Layouts
        </button>
      </div>

      {layouts.length === 0 ? (
        <p>No layouts available.</p>
      ) : (
        Object.entries(
          layouts.reduce<Record<string, PinyaLayout[]>>((acc, layout) => {
            const folder = layout.folder || "No Folder";
            if (!acc[folder]) acc[folder] = [];
            acc[folder].push(layout);
            return acc;
          }, {})
        ).map(([folderName, folderLayouts]) => (
          <div key={folderName} className="border-2 border-[#2f2484] rounded">
            <div className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold flex justify-between items-center">
              {folderName} ({folderLayouts.length})
            </div>
            <ul className="divide-y">
              {folderLayouts.map((layout) => {
                const isSelected = selectedLayouts.includes(layout.id);
                const isPublished = Array.isArray(layout.publishedDates) && layout.publishedDates.length > 0;

                return (
                  <li
                    key={layout.id}
                    className={`p-3 flex justify-between items-center cursor-pointer transition
                      ${isSelected ? "bg-blue-100" : isPublished ? "bg-green-50" : ""}`}
                    onClick={() =>
                      setSelectedLayouts((prev) =>
                        prev.includes(layout.id)
                          ? prev.filter((id) => id !== layout.id)
                          : [...prev, layout.id]
                      )
                    }
                  >
                    <span>{layout.name}</span>
                    {isPublished ? (
                      <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Unpublished
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
