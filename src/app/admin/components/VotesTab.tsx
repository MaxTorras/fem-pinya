// src/app/admin/components/VotesTab.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

type Member = { nickname: string; name?: string; surname?: string; position?: string };
type Event = { id: string; title: string; date: string; time?: string };
type VoteRecord = {
  id: string;
  nickname: string;
  eventId: string;
  vote: "coming" | "late" | "not coming";
  created_at: string;
  comment?: string;
};
type VoteStatus = "coming" | "late" | "not coming" | "no answer";

export default function VotesTab({ members }: { members: Member[] }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showRangeTable, setShowRangeTable] = useState(false);
  const [positionFilter, setPositionFilter] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const eventsRes = await fetch("/api/events");
        const eventsData: Event[] = await eventsRes.json();

        // Fetch votes (attendance)
        const votesRes = await fetch("/api/votes/attendance");
        const votesData = await votesRes.json();
        const votesArray: VoteRecord[] = votesData.records || votesData || [];

        setEvents(eventsData);
        setVotes(votesArray);

        if (eventsData.length) setSelectedEvent(eventsData[0].id);
      } catch (err) {
        console.error("Failed to fetch votes data:", err);
      }
    };

    fetchData();
  }, []);

  // Current event and its votes
  const currentEvent = events.find((e) => e.id === selectedEvent);
  const recordsForEvent = votes.filter((v) => v.eventId === currentEvent?.id);

  // Merge votes with members
  const membersWithStatus = members.map((m) => {
    const record = recordsForEvent.find(
      (r) => r.nickname.toLowerCase() === m.nickname.toLowerCase()
    );
    const status: VoteStatus = record ? record.vote : "no answer";
    return {
      ...m,
      status,
      comment: record?.comment || "",
    };
  });

  const groupedByStatus: Record<VoteStatus, typeof membersWithStatus> = {
    coming: [],
    late: [],
    "not coming": [],
    "no answer": [],
  };

  membersWithStatus.forEach((m) => {
    groupedByStatus[m.status].push(m);
  });

  const statusLabels: Record<
    VoteStatus,
    { label: string; Icon: React.FC<{ size?: number }> }
  > = {
    coming: { label: "Coming", Icon: CheckCircle },
    late: { label: "Late", Icon: Clock },
    "not coming": { label: "Not Coming", Icon: XCircle },
    "no answer": { label: "No Answer", Icon: Clock },
  };

  // Coming-by-position grouping (for this event)
  const comingByPosition = useMemo(() => {
    const comingMembers = membersWithStatus.filter((m) => m.status === "coming");

    return comingMembers.reduce<Record<string, string[]>>((acc, m) => {
      const pos =
        m.position && m.position.trim() !== "" ? m.position.trim() : "Unknown";
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(m.nickname);
      return acc;
    }, {});
  }, [membersWithStatus]);

  const hasComing = Object.keys(comingByPosition).length > 0;

  // We will only render these statuses as cards (no separate "coming" card)
  const visibleStatuses: VoteStatus[] = ["late", "not coming", "no answer"];


const eventsInRange = useMemo(() => {
  if (!fromDate || !toDate) return [];

  return events.filter((e) => {
    const d = new Date(e.date);
    return d >= new Date(fromDate) && d <= new Date(toDate);
  });
}, [events, fromDate, toDate]);
const normalizeKey = (value: string) =>
  value.replace(/\u00A0/g, " ").trim().toLowerCase();

const voteMap = useMemo(() => {
  const map: Record<string, Record<string, VoteStatus>> = {};

  votes.forEach((v) => {
    const memberKey = normalizeKey(v.nickname);

    if (!map[memberKey]) map[memberKey] = {};
    map[memberKey][v.eventId] = v.vote;
  });

  return map;
}, [votes]);
const uniquePositions = useMemo(() => {
  return [...new Set(members.map(m => m.position || "Unknown"))];
}, [members]);

const membersWithVotesInRange = useMemo(() => {
  if (!eventsInRange.length) return [];

  return members.filter((m) => {
    const key = normalizeKey(m.nickname);

    const hasVote = eventsInRange.some(
      (e) => voteMap[key]?.[e.id]
    );

    const matchesPosition =
  positionFilter.length === 0 || // nothing selected = show all
  positionFilter.includes(m.position || "Unknown");

    return hasVote && matchesPosition;
  });
}, [members, eventsInRange, voteMap, positionFilter]);

const formatDateWithDay = (dateStr: string) => {
  const date = new Date(dateStr);

  const day = date.toLocaleDateString("en-GB", { weekday: "short" }); // Mon
  const formatted = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  }); // 25/03

  return `${day} ${formatted}`;
};

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#2f2484] dark:text-yellow-400 mb-2">
  Event Attendance
</h2>

<button
  onClick={() => setShowRangeTable(!showRangeTable)}
  className="px-3 py-1 border rounded border-[#2f2484] dark:border-yellow-400 
             text-[#2f2484] dark:text-yellow-400 
             hover:bg-yellow-400 hover:text-[#2f2484] transition"
>
  {showRangeTable ? "Hide Attendance Table" : "Show Attendance Table"}
</button>
{showRangeTable && (
  <>
<div className="flex gap-2 items-center flex-wrap">
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="border p-2 rounded"
  />
  <span>to</span>
  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="border p-2 rounded"
  />
</div>
<div className="mt-2">
  <p className="text-sm font-semibold mb-1">Filter by position:</p>

  <div className="flex flex-wrap gap-2">
    {uniquePositions.map((pos) => {
      const isSelected = positionFilter.includes(pos);

      return (
        <label
          key={pos}
          className={`px-2 py-1 border rounded cursor-pointer text-sm
            ${isSelected 
              ? "bg-yellow-400 text-[#2f2484]" 
              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"}
          `}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {
              if (isSelected) {
                setPositionFilter(positionFilter.filter(p => p !== pos));
              } else {
                setPositionFilter([...positionFilter, pos]);
              }
            }}
            className="hidden"
          />
          {pos}
        </label>
      );
    })}
  </div>
</div>

<div></div>

      
{eventsInRange.length > 0 && (
  <div className="overflow-auto border rounded p-2 bg-white dark:bg-gray-800">
    <table className="min-w-full text-sm text-center">
      <thead>
        <tr>
          <th className="p-2 text-left">Member</th>
          {eventsInRange.map((e) => (
  <th key={e.id} className="p-2">
    {formatDateWithDay(e.date)}
  </th>
))}
        </tr>
      </thead>
      <tbody>
        {membersWithVotesInRange.map((m) => {
          const key = normalizeKey(m.nickname);

          return (
            <tr key={m.nickname}>
              <td className="p-2 text-left font-semibold">
                {m.nickname}
              </td>

              {eventsInRange.map((e) => {
                const vote = voteMap[key]?.[e.id];

                let symbol = "";
                if (vote === "coming") symbol = "✅";
                else if (vote === "late") symbol = "⏰";
                else if (vote === "not coming") symbol = "❌";

                return (
                  <td key={e.id} className="p-2">
                    {symbol}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}
</>
)}
<div></div>
{/* Event Selector */}
      <select
  className="border-2 border-[#2f2484] dark:border-yellow-400 rounded p-2 mb-4 
             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
             focus:outline-none focus:ring-2 focus:ring-yellow-400"
  value={selectedEvent}
  onChange={(e) => setSelectedEvent(e.target.value)}
>

        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title} ({event.date}
            {event.time ? ` - ${event.time}` : ""})
          </option>
        ))}
      </select>
      {/* Coming by Position (top, primary view) */}
      <div className="border-2 border-[#2f2484] dark:border-yellow-400 rounded p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

        <h3 className="mb-3 font-semibold text-[#2f2484] dark:text-yellow-400 flex items-center gap-2">
  <CheckCircle size={18} />
  <span>Coming ({Object.values(comingByPosition).flat().length})</span>
</h3>
        {!hasComing ? (
          <p className="text-sm text-gray-600">
            No one has voted <span className="font-semibold">coming</span> for this event yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(comingByPosition).map(([pos, nicknames]) => (
              <div
  key={pos}
  className="rounded border border-[#2f2484]/40 dark:border-yellow-400/40 p-2 bg-white dark:bg-gray-700"
>
  <h4 className="mb-1 text-sm font-semibold flex items-center gap-1">
    {pos === "Unknown" ? (
      <>
        <AlertTriangle size={16} className="text-red-600" />
        <span className="text-red-600 dark:text-red-400">Unknown position</span>
      </>
    ) : (
      <span className="text-yellow-500 dark:text-yellow-400">{pos}</span>
    )}
  </h4>
  <ul className="text-sm text-gray-700 dark:text-gray-200 list-disc list-inside">
    {nicknames.map((nick) => (
      <li key={nick}>{nick}</li>
    ))}
  </ul>
</div>

            ))}
          </div>
        )}
      </div>

      {/* Other attendance lists: Late / Not Coming / No Answer */}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleStatuses.map((status) => {
          const { label, Icon } = statusLabels[status];
          return (
            <div key={status} className="border-2 border-[#2f2484] dark:border-yellow-400 rounded p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h3 className="mb-2 font-semibold text-[#2f2484] dark:text-yellow-400 flex items-center gap-1">
    <Icon size={18} />
    {label} ({groupedByStatus[status].length})
  </h3>
  <ul className="text-sm list-disc list-inside text-gray-700 dark:text-gray-200">
    {groupedByStatus[status].map((m) => (
      <li key={m.nickname}>
        <span>{m.nickname}</span>
        {m.comment && (
          <span className="text-gray-400 dark:text-gray-400 ml-2">– {m.comment}</span>
        )}
      </li>
    ))}
  </ul>
</div>

          );
        })}
      </div>
    </div>
  );
}
