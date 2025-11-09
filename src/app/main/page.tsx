/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useMemo, useEffect, useContext } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { supabase } from "@/lib/supabase";
import { UserContext } from "@/context/UserContext";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);

type Event = {
  id: string;
  title: string;
  date: string;
  folder: "Performances" | "Rehearsals" | "Socials";
  time: string;
  google_form?: string; // ✅ new optional field
};

type Vote = "coming" | "late" | "not coming";

export default function MainPage() {
  const { user } = useContext(UserContext);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [monthOpen, setMonthOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, Vote>>({}); // eventId -> vote

  // Fetch events from Supabase
  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });
    if (error) console.error("Supabase fetch error:", error);
    else setEvents(data as Event[]);
    setLoading(false);
  };

  // Fetch votes for logged-in user
  const loadVotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("nickname", user.nickname);

    if (error) console.error("Supabase votes error:", error);
    else {
      const newVotes: Record<string, Vote> = {};
      (data || []).forEach((v: any) => {
        if (v.eventId && v.vote) newVotes[v.eventId] = v.vote;
      });
      setVotes(newVotes);
    }
  };

  useEffect(() => {
    loadEvents();
    loadVotes();
  }, [user]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) =>
          dayjs(e.date).isSameOrAfter(selectedDate.startOf("day"), "day")
        )
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date))),
    [events, selectedDate]
  );

  const startOfWeek = selectedDate.startOf("isoWeek");
  const daysOfWeek = [...Array(7)].map((_, i) => startOfWeek.add(i, "day"));

  const startOfMonth = selectedDate.startOf("month");
  const endOfMonth = selectedDate.endOf("month");
  const daysInMonth: dayjs.Dayjs[] = [];
  let cursor = startOfMonth.startOf("week");
  while (cursor.isBefore(endOfMonth.endOf("week"))) {
    daysInMonth.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const goToToday = () => setSelectedDate(dayjs());

  const handleVote = async (eventId: string, voteValue: Vote) => {
    if (!user) return;

    // Optimistic update
    setVotes((prev) => ({ ...prev, [eventId]: voteValue }));

    const { error } = await supabase
      .from("votes")
      .upsert(
        [{ eventId, nickname: user.nickname, vote: voteValue }],
        { onConflict: '"eventId","nickname"' }
      );

    if (error) console.error("Error saving vote:", error);
  };

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#2f2484]">Calendar</h1>
      </div>

      {/* Calendar Section */}
      <section className="bg-white shadow-md rounded-2xl p-4 border border-gray-100">
        {/* Month Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#2f2484]">
            {selectedDate.format("MMMM YYYY")}
          </h2>
          <div className="flex gap-2 items-center">
            <button
              onClick={goToToday}
              className="text-sm px-2 py-1 border border-[#2f2484] text-[#2f2484] rounded-md hover:bg-[#2f2484] hover:text-white transition"
            >
              Today
            </button>
            <button
              onClick={() => setMonthOpen(!monthOpen)}
              className="text-[#2f2484]"
            >
              {monthOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        </div>

        {/* Month Calendar */}
        <AnimatePresence>
          {monthOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="grid grid-cols-7 text-center text-sm gap-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d, i) => (
                  <div key={`${d}-${i}`} className="font-semibold text-gray-500">
                    {d}
                  </div>
                ))}
                {daysInMonth.map((day) => {
                  const isCurrentMonth = day.month() === selectedDate.month();
                  const isSelected = day.isSame(selectedDate, "day");
                  const isToday = day.isSame(dayjs(), "day");
                  const eventsOnDay = events.filter((e) =>
                    dayjs(e.date).isSame(day, "day")
                  );

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      className={`py-1 rounded-md text-sm transition flex flex-col items-center ${
                        isSelected
                          ? "bg-[#2f2484] text-white"
                          : isToday
                          ? "border border-[#FFD700] text-[#2f2484]"
                          : ""
                      } ${
                        !isCurrentMonth ? "text-gray-400" : "text-gray-800"
                      } hover:bg-yellow-100`}
                    >
                      <span>{day.date()}</span>
                      <div className="flex gap-0.5 mt-0.5">
                        {eventsOnDay.slice(0, 3).map((ev) => {
                          const color =
                            ev.folder === "Performances"
                              ? "#2f2484"
                              : ev.folder === "Rehearsals"
                              ? "#FFD700"
                              : "#4CAF50";
                          return (
                            <span
                              key={ev.id}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week Calendar */}
        <div className="flex justify-between mt-4">
          {daysOfWeek.map((day) => {
            const eventsOnDay = events.filter((e) =>
              dayjs(e.date).isSame(day, "day")
            );
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center text-sm px-2 py-1 rounded-md transition ${
                  day.isSame(selectedDate, "day")
                    ? "bg-[#2f2484] text-white"
                    : day.isSame(dayjs(), "day")
                    ? "font-semibold text-[#2f2484]"
                    : "text-gray-700"
                } hover:bg-yellow-100`}
              >
                <span>{day.format("ddd")}</span>
                <span>{day.format("D")}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {eventsOnDay.slice(0, 3).map((ev) => {
                    const color =
                      ev.folder === "Performances"
                        ? "#2f2484"
                        : ev.folder === "Rehearsals"
                        ? "#FFD700"
                        : "#4CAF50";
                    return (
                      <span
                        key={ev.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white shadow-md rounded-2xl p-4 border border-gray-100">
        <h3 className="text-xl font-semibold text-[#2f2484] mb-3">
          Upcoming Events
        </h3>

        {loading ? (
          <p>Loading events...</p>
        ) : upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="border-l-4 border-[#FFD700] pl-3 py-2 hover:bg-yellow-50 rounded transition mb-2 flex justify-between items-center"
            >
              {/* Event info */}
              <div>
                <p className="font-medium text-[#2f2484]">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {dayjs(event.date).format("dddd, MMM D")} – {event.time}
                </p>

                {/* ✅ Show Google Form link if available */}
                {event.google_form && (
                  <a
                    href={event.google_form}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline mt-1 inline-block"
                  >
                    Open Form
                  </a>
                )}
              </div>

              {/* Voting buttons */}
              {user && (
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleVote(event.id, "coming")}
                    className={`p-1 rounded-full ${
                      votes[event.id] === "coming"
                        ? "text-green-500"
                        : "text-gray-400"
                    } hover:text-green-500 transition`}
                  >
                    <CheckCircle size={24} />
                  </button>
                  <button
                    onClick={() => handleVote(event.id, "late")}
                    className={`p-1 rounded-full ${
                      votes[event.id] === "late"
                        ? "text-yellow-500"
                        : "text-gray-400"
                    } hover:text-yellow-500 transition`}
                  >
                    <Clock size={24} />
                  </button>
                  <button
                    onClick={() => handleVote(event.id, "not coming")}
                    className={`p-1 rounded-full ${
                      votes[event.id] === "not coming"
                        ? "text-red-500"
                        : "text-gray-400"
                    } hover:text-red-500 transition`}
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No upcoming events</p>
        )}
      </section>
    </main>
  );
}
