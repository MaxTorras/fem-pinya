"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type AttendanceRecord = { date: string; nickname: string; timestamp: string };

export default function AttendanceTab({ attendance }: { attendance: AttendanceRecord[] }) {
  const groupedAttendance = attendance.reduce<Record<string, number>>((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(groupedAttendance)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({ date, count }));

  return (
    <>
      <ul className="border-2 border-[#2f2484] dark:border-yellow-400 rounded divide-y mb-6">
        {Object.entries(groupedAttendance)
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([date, count]) => (
            <li
              key={date}
              className="p-3 flex justify-between bg-white dark:bg-gray-700 rounded-md"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100">{date}</span>
              <span className="text-gray-700 dark:text-gray-200">
                {count} check-in{count > 1 ? "s" : ""}
              </span>
            </li>
          ))}
      </ul>

      <div className="w-full h-64">
  <ResponsiveContainer>
    <LineChart data={chartData}>
      {/* Grid */}
      <CartesianGrid
        strokeDasharray="3 3"
        stroke={typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#555" : "#cfd6f0"}
      />

      {/* X Axis */}
      <XAxis
        dataKey="date"
        stroke={typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "#2f2484"}
        tick={{
          fill: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "#2f2484",
        }}
      />

      {/* Y Axis */}
      <YAxis
        allowDecimals={false}
        stroke={typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "#2f2484"}
        tick={{
          fill: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "#2f2484",
        }}
      />

      {/* Tooltip */}
      <Tooltip
        contentStyle={{
          backgroundColor: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#333" : "#f9f9f9",
          borderColor: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#fff" : "#2f2484",
        }}
        itemStyle={{
          color: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#fff" : "#2f2484",
        }}
      />

      {/* Line */}
      <Line
        type="monotone"
        dataKey="count"
        stroke={typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "#ffffff" : "#2f2484"}
        strokeWidth={2}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

    </>
  );
}
