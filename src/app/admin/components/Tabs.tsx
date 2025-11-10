// src/app/admin/components/Tabs.tsx
"use client";

type TabType = "attendance" | "members" | "positions" | "stats" | "tecnica" | "votes" | "events" | "announcements";

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
    <div className="flex gap-2 mb-4 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 py-2 rounded font-semibold transition ${
            activeTab === tab
              ? "bg-[#2f2484] text-yellow-400"
              : "bg-gray-200 text-gray-700 hover:bg-[#2f2484] hover:text-yellow-400"
          }`}
          onClick={() => setActiveTab(tab)}
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
