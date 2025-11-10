"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch announcements from Supabase
  const loadAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ✅ Add new announcement
  const addAnnouncement = async () => {
    if (!title.trim() || !message.trim()) return;

    const { error } = await supabase.from("announcements").insert([
      { title, message },
    ]);

    if (error) {
      alert("Error adding announcement: " + error.message);
      return;
    }

    setTitle("");
    setMessage("");
    await loadAnnouncements(); // refresh list
  };

  // ✅ Delete announcement
  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) alert("Error deleting: " + error.message);
    await loadAnnouncements();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-[#2f2484] dark:text-yellow-400 mb-4">
        📢 Announcements
      </h2>

      {/* Create new announcement */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#2f2484]"
        />
        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-[#2f2484]"
        />
        <button
          onClick={addAnnouncement}
          disabled={loading}
          className="bg-[#2f2484] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#3b35a0] transition"
        >
          {loading ? "Saving..." : "Add Announcement"}
        </button>
      </div>

      {/* List of announcements */}
      {announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="border rounded-lg p-3 shadow-sm bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-[#2f2484]">{a.title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="text-red-500 hover:text-red-700 ml-3"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
