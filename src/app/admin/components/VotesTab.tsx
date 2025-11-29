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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Event Attendance</h2>

      {/* Event Selector */}
      <select
        className="border-2 border-[#2f2484] rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
      <div className="border-2 border-[#2f2484] rounded p-3">
        <h3 className="mb-3 font-semibold text-[#2f2484] flex items-center gap-2">
          <CheckCircle size={18} />
          <span>Coming</span>
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
                className="rounded border border-[#2f2484]/40 p-2 bg-white"
              >
                <h4 className="mb-1 text-sm font-semibold flex items-center gap-1">
                  {pos === "Unknown" ? (
                    <>
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-red-600">Unknown position</span>
                    </>
                  ) : (
                    <span className="text-yellow-500">{pos}</span>
                  )}
                </h4>
                <ul className="text-sm text-gray-700 list-disc list-inside">
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
            <div key={status} className="border-2 border-[#2f2484] rounded p-3">
              <h3 className="mb-2 font-semibold text-[#2f2484] flex items-center gap-1">
                <Icon size={18} />
                {label} ({groupedByStatus[status].length})
              </h3>
              <ul className="text-sm list-disc list-inside text-gray-700">
                {groupedByStatus[status].map((m) => (
                  <li key={m.nickname}>
                    <span>{m.nickname}</span>
                    {m.comment && (
                      <span className="text-gray-400 ml-2">– {m.comment}</span>
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
