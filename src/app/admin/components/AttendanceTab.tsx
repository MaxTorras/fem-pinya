// src/app/admin/components/AttendanceTab.tsx
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
  );
}
