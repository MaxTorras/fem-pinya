// src/app/admin/components/MembersTab.tsx
"use client";

import { useMemo } from "react";

type Member = { nickname: string; name?: string; surname?: string };
type AttendanceRecord = { date: string; nickname: string; timestamp: string };

export default function MembersTab({
  members,
  attendance,
}: {
  members: Member[];
  attendance: AttendanceRecord[];
}) {
  const attendanceByMember = useMemo(() => {
    const byMember: Record<string, string[]> = {};

    attendance.forEach((r) => {
      if (!byMember[r.nickname]) byMember[r.nickname] = [];
      byMember[r.nickname].push(r.date);
    });

    return Object.entries(byMember)
      .map(([nickname, dates]) => {
        const sorted = dates
          .map((d) => new Date(d))
          .sort((a, b) => a.getTime() - b.getTime());

        let streak = 1;
        let bestStreak = 1;

        for (let i = 1; i < sorted.length; i++) {
          const diff =
            (sorted[i].getTime() - sorted[i - 1].getTime()) /
            (1000 * 3600 * 24);

          if (diff >= 6 && diff <= 8) {
            streak++;
          } else {
            streak = 1;
          }
          bestStreak = Math.max(bestStreak, streak);
        }

        return { nickname, count: dates.length, currentStreak: bestStreak };
      })
      .sort((a, b) => b.count - a.count);
  }, [attendance]);

  return (
    <div className="space-y-6">
      {/* 🧑‍🤝‍🧑 Basic member list */}
      <section>
        <h2 className="text-lg font-semibold text-[#2f2484] mb-2">
          Members
        </h2>
        <ul className="border-2 border-[#2f2484] rounded divide-y">
          {members.map((m) => (
            <li key={m.nickname} className="p-3">
              <span className="font-semibold">{m.nickname}</span>
              {(m.name || m.surname) && (
                <span className="text-gray-500 text-sm ml-2">
                  ({m.name || ""} {m.surname || ""})
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 📊 Attendance stats */}
      <section>
        <h2 className="text-lg font-semibold text-[#2f2484] mb-2">
          Attendance Stats
        </h2>
        <ul className="border-2 border-[#2f2484] rounded divide-y">
          {attendanceByMember.map(({ nickname, count, currentStreak }) => {
            const member = members.find(
              (m) => m.nickname.toLowerCase() === nickname.toLowerCase()
            );
            const showFire = currentStreak >= 3;

            return (
              <li
                key={nickname}
                className="p-3 flex justify-between items-center dark:text-gray-100"
              >
                <span>
                  {member
                    ? `${member.name || ""} ${member.surname || ""}`.trim()
                    : nickname}
                  <span className="text-gray-500 text-sm ml-2">
                    ({nickname})
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{count}x</span>
                  {showFire && (
                    <span className="text-orange-500 text-lg">
                      🔥 ↑ {currentStreak}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
