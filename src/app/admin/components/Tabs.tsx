// src/app/admin/components/Tabs.tsx
"use client";

type TabType =
  | "attendance"
  | "members"
  | "positions"
  | "stats"
  | "tecnica"
  | "votes"
  | "events"
  | "announcements";

export default function Tabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: TabType[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
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
            : tab === "stats"
            ? "Stats"
            : tab === "tecnica"
            ? "Tecnica"
            : tab === "votes"
            ? "Votes"
            : tab === "events"
            ? "Events"
            : "Announcements"}
        </button>
      ))}
    </div>
  );
}
