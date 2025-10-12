"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";

type AttendanceRecord = {
  date: string;
  nickname: string;
  timestamp: string;
};

type Member = {
  nickname: string;
  name?: string;
  surname?: string;
  position?: string;
};

type Tab = "attendance" | "members" | "positions";

// Reusable Tabs component
function Tabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Tab[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 py-2 rounded ${
            activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "attendance"
            ? "Attendance"
            : tab === "members"
            ? "Members"
            : "By Position"}
        </button>
      ))}
    </div>
  );
}

// Reusable DaySelector component
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
      className="border rounded p-2 mb-4"
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
  const [loading, setLoading] = useState(false);

  // Selected date for "By Position" tab
  const attendanceDates = Array.from(
    new Set(attendance.map((r) => r.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const [selectedDate, setSelectedDate] = useState(attendanceDates[0] || "");

  // Set initial selectedDate once after attendance is loaded
useEffect(() => {
  if (!selectedDate && attendanceDates.length > 0) {
    setSelectedDate(attendanceDates[0]);
  }
}, [attendanceDates, selectedDate]);

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setLoggedIn(true);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Network error");
    }
  };

  useEffect(() => {
    if (!loggedIn) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const membersRes = await fetch("/api/members");
        const attendanceRes = await fetch("/api/attendance");

        const membersData = await membersRes.json();
        const attendanceData = await attendanceRes.json();

        setMembers(membersData.members || []);
        setAttendance(attendanceData.records || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loggedIn]);

  const groupedAttendance = attendance.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.date] = (acc[r.date] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = Object.entries(groupedAttendance)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({ date, count }));

  const attendanceForSelectedDate = attendance.filter(
    (r) => r.date === selectedDate
  );

  const membersByPosition = useMemo(() => {
  const filtered = attendance.filter((r) => r.date === selectedDate);

  return filtered.reduce<Record<string, Member[]>>((acc, record) => {
    const member = members.find(
      (m) => m.nickname.toLowerCase() === record.nickname.toLowerCase()
    );
    const pos = member?.position || "Unknown";
    if (!acc[pos]) acc[pos] = [];
    if (member) acc[pos].push(member);
    return acc;
  }, {});
}, [attendance, members, selectedDate]);

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin password"
          className="border rounded p-2 w-64 text-center"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enter
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <Tabs
        tabs={["attendance", "members", "positions"]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {loading ? (
        <p>Loading...</p>
      ) : activeTab === "attendance" ? (
        <>
          <ul className="border rounded divide-y mb-6">
            {Object.entries(groupedAttendance)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, count]) => (
                <li key={date} className="p-3 flex justify-between">
                  <span className="font-semibold">{date}</span>
                  <span>
                    {count} check-in{count > 1 ? "s" : ""}
                  </span>
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
                <Line type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : activeTab === "members" ? (
        <ul className="border rounded divide-y">
          {members.map((m) => (
            <li key={m.nickname} className="p-2">
              {m.name} {m.surname}{" "}
              <span className="text-gray-600 text-sm">({m.nickname})</span>
            </li>
          ))}
        </ul>
      ) : (
        // By Position
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-2">Check-ins by Position</h2>
          <DaySelector
            dates={attendanceDates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          {Object.keys(membersByPosition).length === 0 ? (
            <p>No attendance records for this day.</p>
          ) : (
            Object.entries(membersByPosition).map(([position, list]) => (
              <div key={position} className="border rounded p-3">
                <h3 className="font-semibold text-blue-600 mb-2">{position}</h3>
                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {list.map((m) => (
                    <li key={m.nickname}>
                      {m.name} {m.surname} ({m.nickname})
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
