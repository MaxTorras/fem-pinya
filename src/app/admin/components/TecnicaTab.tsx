// src/app/admin/components/TecnicaTab.tsx
"use client";

import { useState } from "react";

// 👇 Match the DB: snake_case `published_dates`
type PinyaLayout = {
  id: string;
  name: string;
  folder?: string;
  published_dates?: string[]; // Supabase column
};

export default function TecnicaTab({ layouts }: { layouts: PinyaLayout[] }) {
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);

  const toggleSelected = (layoutId: string) => {
    setSelectedLayouts((prev) =>
      prev.includes(layoutId)
        ? prev.filter((id) => id !== layoutId)
        : [...prev, layoutId]
    );
  };

  const handlePublish = async () => {
    try {
      await fetch("/api/layouts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // long-term publish: no date, just ids
        body: JSON.stringify({ layoutIds: selectedLayouts }),
      });

      setSelectedLayouts([]);
      alert("Layouts published to Pinya Overview!");
    } catch (err) {
      console.error(err);
      alert("Failed to publish layouts");
    }
  };

  const handleUnpublish = async () => {
    try {
      await fetch("/api/layouts/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutIds: selectedLayouts }),
      });

      setSelectedLayouts([]);
      alert("Layouts unpublished from Pinya Overview");
    } catch (err) {
      console.error(err);
      alert("Failed to unpublish layouts");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] dark:text-yellow-400 mb-2">
  Tecnica – Select Layouts to Show in Overview
</h2>


      <div className="flex gap-2 mb-2">
        <button
          onClick={handlePublish}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={selectedLayouts.length === 0}
        >
          Publish Selected Layouts
        </button>

        <button
          onClick={handleUnpublish}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={selectedLayouts.length === 0}
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
          <div key={folderName} className="border-2 border-[#2f2484] dark:border-gray-600 rounded">

            <div className="w-full text-left px-3 py-2 
  bg-gray-100 dark:bg-gray-800 
  text-gray-800 dark:text-gray-100
  font-semibold flex justify-between items-center">

              {folderName} ({folderLayouts.length})
            </div>
            <ul className="divide-y">
              {folderLayouts.map((layout) => {
                const isSelected = selectedLayouts.includes(layout.id);

                // 🔹 Layout is "published" if published_dates contains "GLOBAL"
                const isPublished =
                  Array.isArray(layout.published_dates) &&
                  layout.published_dates.includes("GLOBAL");

                return (
                  <li
                    key={layout.id}
                    className={`p-3 flex justify-between items-center cursor-pointer transition
  text-gray-800 dark:text-gray-100
  ${
    isSelected
      ? "bg-blue-100 dark:bg-blue-900/40"
      : isPublished
      ? "bg-green-50 dark:bg-green-900/30"
      : "hover:bg-gray-100 dark:hover:bg-gray-800"
  }`}

                    onClick={() => toggleSelected(layout.id)}
                  >
                    <span>{layout.name}</span>
                    {isPublished ? (
                    <span className="text-xs font-semibold 
  text-green-700 dark:text-green-300 
  bg-green-100 dark:bg-green-900/40
  px-2 py-0.5 rounded-full">


                        Published
                      </span>
                    ) : (
                      <span className="text-xs 
  text-gray-600 dark:text-gray-300 
  bg-gray-100 dark:bg-gray-700
  px-2 py-0.5 rounded-full">

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
