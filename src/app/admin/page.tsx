// eslint-disable-next-line @typescript-eslint/no-explicit-any
"use client";

import { useState, useEffect } from "react";
import { Quicksand } from "next/font/google";
import Tabs from "./components/Tabs";

// Tab components
import AttendanceTab from "./components/AttendanceTab";
import MembersTab from "./components/MembersTab";
import PositionsTab from "./components/PositionsTab";
import StatsTab from "./components/StatsTab";
import TecnicaTab from "./components/TecnicaTab";
import VotesTab from "./components/VotesTab";

type TabType = "attendance" | "members" | "positions" | "stats" | "tecnica" | "votes";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("attendance");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersRes, attendanceRes, layoutsRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/attendance"),
          fetch("/api/layouts"),
        ]);
        const membersData = await membersRes.json();
        const attendanceData = await attendanceRes.json();
        const layoutsData = await layoutsRes.json();

        setMembers(membersData.members || []);
        setAttendance(attendanceData.records || []);
        setLayouts(Array.isArray(layoutsData) ? layoutsData : []);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className={`${quicksand.className} p-6 max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen`}>
      <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400 mb-6">Admin Dashboard</h1>

      <Tabs
        tabs={["attendance", "members", "positions", "stats", "tecnica", "votes"]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {activeTab === "attendance" && <AttendanceTab attendance={attendance} />}
          {activeTab === "members" && <MembersTab members={members} />}
          {activeTab === "positions" && <PositionsTab attendance={attendance} members={members} />}
          {activeTab === "stats" && <StatsTab attendance={attendance} members={members} />}
          {activeTab === "tecnica" && <TecnicaTab layouts={layouts} />}
          {activeTab === "votes" && <VotesTab members={members} />}
        </>
      )}
    </main>
  );
}
