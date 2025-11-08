// src/app/admin/components/PositionsTab.tsx
"use client";

import { useState, useMemo, useEffect } from "react";

type Member = { nickname: string; name?: string; surname?: string; position?: string };
type AttendanceRecord = { date: string; nickname: string; timestamp: string };

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

export default function PositionsTab({
  attendance,
  members,
}: {
  attendance: AttendanceRecord[];
  members: Member[];
}) {
  const attendanceDates = Array.from(new Set(attendance.map((r) => r.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const [selectedDate, setSelectedDate] = useState(attendanceDates[attendanceDates.length - 1] || "");

  useEffect(() => {
    if (!selectedDate && attendanceDates.length > 0) setSelectedDate(attendanceDates[attendanceDates.length - 1]);
  }, [attendanceDates, selectedDate]);

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Check-ins by Position</h2>
      <DaySelector dates={attendanceDates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {Object.keys(membersByPosition).length === 0 ? (
        <p>No attendance records for this day.</p>
      ) : (
        Object.entries(membersByPosition).map(([pos, list]) => (
          <div key={pos} className="border-2 border-[#2f2484] rounded p-3">
            <h3 className="mb-2">
              {pos === "Unknown" ? (
                <span className="text-red-600 font-semibold">⚠️ Missing / Unmatched Position</span>
              ) : (
                <span className="text-yellow-500 font-semibold">{pos}</span>
              )}
            </h3>
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {list.map(({ member, rawNickname }) => (
                <li key={rawNickname}>
                  {member ? (
                    <>
                      <span>{member.nickname}</span>
                      {(member.name || member.surname) && (
                        <span className="text-gray-500 text-sm ml-1">
                          ({member.name || ""} {member.surname || ""})
                        </span>
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
  );
}
