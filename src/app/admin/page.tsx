"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type AttendanceRecord = {
  date: string;
  nickname: string;
  timestamp: string;
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"attendance" | "members">("attendance");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Login handler
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

  // Fetch data only if logged in
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

  // Group attendance by day
  const groupedAttendance = attendance.reduce<Record<string, number>>((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});

  // Prepare data for chart
  const chartData = Object.entries(groupedAttendance)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({ date, count }));

  // Render login or dashboard
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

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === "attendance" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === "members" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <p>Loading...</p>
      ) : activeTab === "attendance" ? (
        <>
          <ul className="border rounded divide-y mb-6">
            {Object.entries(groupedAttendance)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, count]) => (
                <li key={date} className="p-3">
                  <span className="font-semibold">{date}</span>: {count} member{count > 1 ? "s" : ""} checked in
                </li>
              ))}
          </ul>

          {/* Chart */}
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
      ) : (
        <ul className="border rounded divide-y">
          {members.map((m) => (
            <li key={m} className="p-2">
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
