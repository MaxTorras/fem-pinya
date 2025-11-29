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
  // ✅ 1) DEDUPE MEMBERS BY NICKNAME
  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    const result: Member[] = [];

    members.forEach((m) => {
      const key = m.nickname.trim().toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(m);
    });

    return result;
  }, [members]);

  // ✅ 2) BUILD STATS USING uniqueMembers + timestamp
  const stats = useMemo(() => {
    const byMember: Record<string, string[]> = {};

    attendance.forEach((r) => {
      const key = r.nickname;
      const dayKey = new Date(r.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD

      if (!byMember[key]) byMember[key] = [];
      if (!byMember[key].includes(dayKey)) {
        byMember[key].push(dayKey);
      }
    });

    return uniqueMembers
      .map((m) => {
        const days = byMember[m.nickname] || [];

        if (days.length === 0) {
          return {
            nickname: m.nickname,
            name: m.name,
            surname: m.surname,
            count: 0,
            streak: 0,
          };
        }

        const sorted = days
          .map((d) => new Date(d))
          .sort((a, b) => a.getTime() - b.getTime());

        let currentStreak = 1;
        let bestStreak = 1;

        for (let i = 1; i < sorted.length; i++) {
          const diffDays =
            (sorted[i].getTime() - sorted[i - 1].getTime()) /
            (1000 * 3600 * 24);

          // weekly(ish): keep streak if within 9 days
          if (diffDays <= 9) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
          bestStreak = Math.max(bestStreak, currentStreak);
        }

        return {
          nickname: m.nickname,
          name: m.name,
          surname: m.surname,
          count: days.length,
          streak: bestStreak,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [attendance, uniqueMembers]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">
        Members & Attendance
      </h2>

      <ul className="border-2 border-[#2f2484] rounded divide-y">
        {stats.map(({ nickname, name, surname, count, streak }, index) => {
          const showFire = streak > 3; // 🔥 4+ consecutive weeks

          return (
            <li
              key={`${nickname}-${index}`} // ✅ unique even if something slips through
              className="p-3 flex justify-between items-center dark:text-gray-100"
            >
              <span>
                {`${name || ""} ${surname || ""}`.trim() || nickname}
                <span className="text-gray-500 text-sm ml-2">
                  ({nickname})
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{count}x</span>
                {showFire && (
                  <span className="text-orange-500 text-lg">🔥</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
