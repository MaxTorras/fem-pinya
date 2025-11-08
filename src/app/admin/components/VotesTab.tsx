// src/app/admin/components/VotesTab.tsx
"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";

type Member = { nickname: string; name?: string; surname?: string };
type Event = { id: string; title: string; date: string; time?: string };
type VoteRecord = {
  id: string;
  nickname: string;
  eventId: string;
  vote: "coming" | "late" | "not_coming";
  created_at: string;
  comment?: string;
};
type VoteStatus = "coming" | "late" | "not_coming";

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
    return {
      ...m,
      status: record?.vote || "not_coming",
      comment: record?.comment || "",
    };
  });

  // Group members by status safely
  const groupedByStatus: Record<VoteStatus, typeof membersWithStatus> = {
    coming: [],
    late: [],
    not_coming: [],
  };
  membersWithStatus.forEach((m) => {
    groupedByStatus[m.status].push(m);
  });

  const statusLabels: Record<VoteStatus, { label: string; Icon: React.FC<{ size?: number }> }> = {
    coming: { label: "Coming", Icon: CheckCircle },
    late: { label: "Late", Icon: Clock },
    not_coming: { label: "Not Coming", Icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Event Attendance</h2>

      {/* Event Selector */}
      <select
        className="border-2 border-[#2f2484] rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title} ({event.date}{event.time ? ` - ${event.time}` : ""})
          </option>
        ))}
      </select>

      {/* Attendance Lists */}
      {(Object.keys(groupedByStatus) as VoteStatus[]).map((status) => {
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
                  {(m.name || m.surname) && (
                    <span className="text-gray-500 ml-1">
                      ({m.name || ""} {m.surname || ""})
                    </span>
                  )}
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
  );
}
