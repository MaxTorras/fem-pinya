"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Quicksand } from "next/font/google";

type Member = { nickname: string; name?: string; surname?: string; position?: string };

type LayoutPosition = {
  id: string;
  label: string;
  x: number;
  y: number;
  member?: Member;
  rotation?: number;
};

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

type AttendanceRecord = { date: string; nickname: string; timestamp: string };

type PinyaLayout = { id: string; name: string; folder?: string; positions?: LayoutPosition[] };

type Tab = "attendance" | "members" | "positions" | "stats" | "tecnica";

// API response types
type MembersResponse = { members: Member[] };
type AttendanceResponse = { records: AttendanceRecord[] };
type ErrorResponse = { error?: string };

// Tabs component
function Tabs({ tabs, activeTab, setActiveTab }: { tabs: Tab[]; activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(tab => (
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
            : "Tecnica"}
        </button>
      ))}
    </div>
  );
}

// Day selector for "By Position" and "Tecnica"
function DaySelector({
  dates,
  selectedDate,
  setSelectedDate,
}: {
  dates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  if (dates.length <= 1) return null;
  return (
    <select
      className="border-2 border-[#2f2484] rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    >
      {dates.map((date) => (
        <option key={date} value={date}>
          {date}
        </option>
      ))}
    </select>
  );
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [layouts, setLayouts] = useState<PinyaLayout[]>([]);
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const isoDate = today.toISOString().split("T")[0];

  // Unique dates from attendance
  const attendanceDates = Array.from(new Set(attendance.map((r) => r.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  const [selectedDate, setSelectedDate] = useState(attendanceDates[attendanceDates.length - 1] || "");

  useEffect(() => {
    if (!selectedDate && attendanceDates.length > 0) {
      setSelectedDate(attendanceDates[attendanceDates.length - 1]);
    }
  }, [attendanceDates, selectedDate]);

  // --- Login ---
  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) setLoggedIn(true);
      else {
        const data = (await res.json()) as ErrorResponse;
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Network error");
    }
  };

  // --- Fetch all data ---
  useEffect(() => {
    if (!loggedIn) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const membersRes = await fetch("/api/members");
        const attendanceRes = await fetch("/api/attendance");
        const layoutsRes = await fetch("/api/layouts");

        const membersData = (await membersRes.json()) as MembersResponse;
        const attendanceData = (await attendanceRes.json()) as AttendanceResponse;
        const layoutsData = (await layoutsRes.json()) as PinyaLayout[];

        setMembers(membersData.members || []);
        setAttendance(attendanceData.records || []);
        setLayouts(Array.isArray(layoutsData) ? layoutsData : []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loggedIn]);

  // --- Chart Data ---
  const groupedAttendance = attendance.reduce<Record<string, number>>((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(groupedAttendance)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({ date, count }));

  // --- Members by Position ---
  const membersByPosition = useMemo(() => {
    return attendance
      .filter((r) => r.date === selectedDate)
      .reduce<Record<string, { member?: Member; rawNickname: string }[]>>((acc, record) => {
        const member = members.find(
          (m) => m.nickname.toLowerCase().trim() === record.nickname.toLowerCase().trim()
        );
        const pos = member?.position && member.position.trim() !== "" ? member.position : "Unknown";

        if (!acc[pos]) acc[pos] = [];
        acc[pos].push({ member, rawNickname: record.nickname });
        return acc;
      }, {});
  }, [attendance, members, selectedDate]);

  // --- Stats ---
  const attendanceByMember = useMemo(() => {
    const byMember: Record<string, string[]> = {};
    attendance.forEach((r) => {
      if (!byMember[r.nickname]) byMember[r.nickname] = [];
      byMember[r.nickname].push(r.date);
    });

    return Object.entries(byMember)
      .map(([nickname, dates]) => {
        const sortedDates = dates.map((d) => new Date(d)).sort((a, b) => a.getTime() - b.getTime());

        let streak = 1;
        let currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const diffDays = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 3600 * 24);
          if (diffDays >= 6 && diffDays <= 8) streak++;
          else streak = 1;
          currentStreak = Math.max(currentStreak, streak);
        }

        return { nickname, count: dates.length, currentStreak: streak };
      })
      .sort((a, b) => b.count - a.count);
  }, [attendance]);

  // --- Login Screen ---
  if (!loggedIn) {
    return (
      <div className={`${quicksand.className} flex flex-col items-center justify-center min-h-screen gap-4 bg-white dark:bg-gray-900`}>
        <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-2 border-[#2f2484] rounded p-3 w-64 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleLogin}
          className="bg-[#2f2484] text-yellow-400 px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition"
        >
          Enter
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // --- Main Render ---
  return (
    <main className={`${quicksand.className} p-6 max-w-3xl mx-auto bg-white dark:bg-gray-900 min-h-screen`}>
      <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400 mb-6">Admin Dashboard</h1>

      <Tabs tabs={["attendance", "members", "positions", "stats", "tecnica"]} activeTab={activeTab} setActiveTab={setActiveTab} />

      {loading ? (
        <p>Loading...</p>
      ) : activeTab === "attendance" ? (
        <>
          <ul className="border-2 border-[#2f2484] rounded divide-y mb-6">
            {Object.entries(groupedAttendance)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, count]) => (
                <li key={date} className="p-3 flex justify-between">
                  <span className="font-semibold">{date}</span>
                  <span>{count} check-in{count > 1 ? "s" : ""}</span>
                </li>
              ))}
          </ul>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2f2484" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : activeTab === "members" ? (
        <ul className="border-2 border-[#2f2484] rounded divide-y">
          {members.map((m) => (
            <li key={m.nickname} className="p-3">
              {m.name} {m.surname} <span className="text-gray-600 text-sm">({m.nickname})</span>
            </li>
          ))}
        </ul>
      ) : activeTab === "positions" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Check-ins by Position</h2>
          <DaySelector dates={attendanceDates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          {Object.keys(membersByPosition).length === 0 ? (
            <p>No attendance records for this day.</p>
          ) : (
            Object.entries(membersByPosition).map(([pos, list]) => (
              <div key={pos} className="border-2 border-[#2f2484] rounded p-3">
                <h3 className="mb-2">
                  {pos === "Unknown" ? <span className="text-red-600 font-semibold">⚠️ Missing / Unmatched Position</span> : <span className="text-yellow-500 font-semibold">{pos}</span>}
                </h3>
                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {list.map(({ member, rawNickname }) => (
                    <li key={rawNickname}>
                      {member ? (
                        <>
                          <span>{member.nickname}</span>
                          {(member.name || member.surname) && (
                            <span className="text-gray-500 text-sm ml-1">({member.name || ""} {member.surname || ""})</span>
                          )}
                        </>
                      ) : (
                        <span>{rawNickname}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "stats" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Attendance Stats</h2>
          <ul className="border-2 border-[#2f2484] rounded divide-y">
            {attendanceByMember.map(({ nickname, count, currentStreak }) => {
              const member = members.find((m) => m.nickname.toLowerCase() === nickname.toLowerCase());
              const showFire = currentStreak >= 3;
              return (
                <li key={nickname} className="p-3 flex justify-between items-center dark:text-gray-100">
                  <span>
                    {member ? `${member.name || ""} ${member.surname || ""}`.trim() : nickname}
                    <span className="text-gray-500 text-sm ml-2">({nickname})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{count}x</span>
                    {showFire && <span className="text-orange-500 text-lg">🔥 ↑ {currentStreak}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : activeTab === "tecnica" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Tecnica – Select Layouts for Today</h2>
          {layouts.length === 0 ? (
            <p>No layouts available.</p>
          ) : (
            <ul className="border-2 border-[#2f2484] rounded divide-y">
              {layouts.map((layout) => (
                <li key={layout.id} className="p-3 flex justify-between items-center">
                  <span>{layout.name} {layout.folder ? `(${layout.folder})` : ""}</span>
                  <input
                    type="checkbox"
                    checked={selectedLayouts.includes(layout.id)}
                    onChange={(e) => setSelectedLayouts((prev) =>
                      e.target.checked ? [...prev, layout.id] : prev.filter((id) => id !== layout.id)
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={async () => {
              try {
                await fetch("/api/layouts/publish", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: isoDate, layoutIds: selectedLayouts }),
                });
                alert("✅ Layouts published for today!");
              } catch (err) {
                console.error(err);
                alert("❌ Failed to publish layouts");
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Publish Selected Layouts
          </button>
        </div>
      ) : null}
    </main>
  );
}
