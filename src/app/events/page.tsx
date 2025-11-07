"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  folder: string;
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [time, setTime] = useState("");
  const [tbc, setTbc] = useState(false);
  const [folder, setFolder] = useState("Performances");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load events from Supabase
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

  useEffect(() => {
    loadEvents();
  }, []);

  // Save or update event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newEvent = {
      title,
      date,
      time: tbc ? "TBC" : time,
      folder,
    };

    let result;
    if (editingId) {
      result = await supabase.from("events").update(newEvent).eq("id", editingId);
    } else {
      result = await supabase.from("events").insert([newEvent]);
    }

    console.log("Save result:", result); // Debugging
    if (result.error) console.error("Supabase insert/update error:", result.error);
    else {
      setTitle("");
      setTime("");
      setTbc(false);
      setFolder("Performances");
      setEditingId(null);
      await loadEvents();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) console.error(error);
    else loadEvents();
  };

  const handleEdit = (ev: Event) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDate(ev.date);
    setTbc(ev.time === "TBC");
    setTime(ev.time === "TBC" ? "" : ev.time);
    setFolder(ev.folder);
  };

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Add/Edit Form */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-[#2f2484] mb-1">
          {editingId ? "Edit Event" : "Add New Event"}
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          {editingId
            ? "Update details below and save"
            : "Create a new event for the calendar"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#2f2484] mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
              placeholder="e.g. Full Rehearsal"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-[#2f2484] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-semibold text-[#2f2484] mb-1">
              Time
            </label>
            {!tbc && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
              />
            )}
            <div className="flex items-center gap-2 mt-1">
              <input
                id="tbc"
                type="checkbox"
                checked={tbc}
                onChange={() => setTbc(!tbc)}
              />
              <label htmlFor="tbc" className="text-sm text-gray-700">
                Time TBC
              </label>
            </div>
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-semibold text-[#2f2484] mb-1">
              Folder
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#FFD700] focus:outline-none"
            >
              <option>Performances</option>
              <option>Rehearsals</option>
              <option>Socials</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 bg-[#2f2484] text-white font-semibold py-3 rounded-full hover:bg-[#3a32a0] transition disabled:opacity-70"
          >
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Event"}
          </button>
        </form>
      </div>

      {/* Right: Event List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[#2f2484] mb-4">
          All Events
        </h2>
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events found.</p>
        ) : (
          <ul className="space-y-3 max-h-[70vh] overflow-y-auto">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="border border-gray-200 rounded-md p-3 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-[#2f2484]">{ev.title}</p>
                  <p className="text-sm text-gray-600">
                    {dayjs(ev.date).format("DD MMM")} — {ev.time} ({ev.folder})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ev)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
