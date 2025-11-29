// src/app/admin/components/Tabs.tsx
"use client";

import { Dispatch, SetStateAction } from "react";

export type TabType =
  | "tecnica"
  | "votes"
  | "positions"
  | "events"
  | "announcements"
  | "attendance"
  | "members"
  | "editpositions";

type TabsProps = {
  tabs: TabType[];
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
};

export default function Tabs({ tabs, activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="flex overflow-x-auto gap-2 mb-4 p-1 scrollbar-hide border-b border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap
            ${
              activeTab === tab
                ? "bg-[#2f2484] text-yellow-400 shadow-sm"
                : "bg-white text-gray-700 hover:bg-[#2f2484]/10 hover:text-[#2f2484] dark:bg-gray-700 dark:text-gray-300"
            }`}
        >
          {tab === "attendance"
            ? "Attendance"
            : tab === "members"
            ? "Members"
            : tab === "positions"
            ? "By Position"
            : tab === "tecnica"
            ? "Tecnica"
            : tab === "votes"
            ? "Votes"
            : tab === "events"
            ? "Events"
            : tab === "announcements"
            ? "Announcements"
            : "Edit Positions" /* editpositions */}
        </button>
      ))}
    </div>
  );
}
