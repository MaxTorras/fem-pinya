"use client";

import { useState } from "react";
import dayjs from "dayjs";

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [time, setTime] = useState("");
  const [tbc, setTbc] = useState(false);
  const [folder, setFolder] = useState("Performances");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newEvent = {
      title,
      date,
      time: tbc ? "TBC" : time,
      folder,
    };

    // TODO: Replace with your Supabase or API call
    console.log("Saving event:", newEvent);

    setTimeout(() => {
      alert("✅ Event saved!");
      setSaving(false);
      setTitle("");
      setTime("");
      setTbc(false);
      setFolder("Performances");
    }, 800);
  };

  return (
    <main className="p-6 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-[#2f2484] mb-1">
          Add New Event
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Create a new event for the calendar
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
            >
              <option>Performances</option>
              <option>Rehearsals</option>
              <option>Socials</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 bg-[#2f2484] text-white font-semibold py-3 rounded-full hover:bg-[#3a32a0] transition disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
