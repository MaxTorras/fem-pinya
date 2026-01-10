"use client";

import { useMemo, useState } from "react";

type Member = { 
  nickname: string; 
  name?: string; 
  surname?: string; 
  position?: string;
  colla?: string;
  collaColor?: string;
};
type AttendanceRecord = { date: string; nickname: string; timestamp: string };

// Helper to get contrasting color (black/white) depending on background
const getContrastColor = (hexColor: string) => {
  if (!hexColor?.startsWith("#") || hexColor.length !== 7) return "#fff";
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#000" : "#fff";
};

export default function MembersTab({
  members,
  attendance,
}: {
  members: Member[];
  attendance: AttendanceRecord[];
}) {
  const [showOnlyMyColla, setShowOnlyMyColla] = useState(false); // <-- new state

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    const result: Member[] = [];
    members.forEach((m) => {
      const key = m.nickname.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(m);
      }
    });
    return result;
  }, [members]);

  const stats = useMemo(() => {
    const byMember: Record<string, string[]> = {};

    attendance.forEach((r) => {
      const dayKey = new Date(r.timestamp).toISOString().slice(0, 10);
      if (!byMember[r.nickname]) byMember[r.nickname] = [];
      if (!byMember[r.nickname].includes(dayKey)) byMember[r.nickname].push(dayKey);
    });

    const calculateStreak = (dates: string[]) => {
      if (!dates.length) return 0;
      const sorted = dates.map(d => new Date(d)).sort((a, b) => +a - +b);
      let streak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) streak++;
        else streak = 1;
        if (streak > maxStreak) maxStreak = streak;
      }
      return maxStreak;
    };

    return uniqueMembers
      .map((m) => {
        const days = byMember[m.nickname] || [];
        const lastMonthCount = days.filter(d => new Date(d) >= oneMonthAgo).length;
        const streak = calculateStreak(days);

        return {
          ...m,
          count: days.length,
          lastMonthCount,
          greyedOut: lastMonthCount === 0,
          streak,
        };
      })
      .sort((a, b) => {
        if (a.greyedOut && !b.greyedOut) return 1;
        if (!a.greyedOut && b.greyedOut) return -1;
        return b.count - a.count;
      });
  }, [attendance, uniqueMembers]);

  // Filter members if "show only my colla" is active
  const filteredStats = showOnlyMyColla
    ? stats.filter(m => !m.colla) // only members with empty colla
    : stats;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">
        Members & Attendance
      </h2>

      {/* Toggle button */}
      <button
        className="px-3 py-1 border rounded border-[#2f2484] text-[#2f2484] hover:bg-[#2f2484] hover:text-white transition"
        onClick={() => setShowOnlyMyColla(!showOnlyMyColla)}
      >
        {showOnlyMyColla ? "Show All Collas" : "Show Only My Colla"}
      </button>

      <ul className="border-2 border-[#2f2484] rounded divide-y mt-2">
        {filteredStats.map(({ nickname, name, surname, count, greyedOut, colla, collaColor, streak }, index) => {
          const displayName = `${name || ""} ${surname || ""}`.trim() || nickname;

          // Colla initials
          const collaInitials = colla
            ? colla
                .split(" ")
                .map((w) => w[0])
                .join("")
            : "";

          // Name color (optional)
          const nameStyle: React.CSSProperties = collaColor ? { color: collaColor } : {};

          // Greyed out members
          const nicknameStyle: React.CSSProperties = greyedOut ? { color: "#9ca3af" } : {};

          return (
            <li
              key={`${nickname}-${index}`}
              className="p-3 flex justify-between items-center"
            >
              <span className="flex items-center gap-1">
                <span style={nameStyle}>
                  {displayName} {collaInitials && `(${collaInitials})`}
                  <span style={nicknameStyle} className="text-sm ml-1">
                    ({nickname})
                  </span>
                </span>

                {/* Fire emoji for streak >3 */}
                {streak > 3 && !greyedOut && <span className="ml-1">🔥</span>}
              </span>

              <span className="font-semibold">{count}x</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
