// src/app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // if you already use it

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) setAnnouncements(data);
      setLoading(false);
    };

    fetchAnnouncements();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      {/* Announcements Panel */}
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full border-l-4 border-[#2f2484]">
        <h1 className="text-2xl font-bold mb-3 text-[#2f2484]">📢 Announcements</h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : announcements.length > 0 ? (
          <ul className="space-y-4 text-left">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-gray-200 pb-2">
                <h3 className="font-semibold text-[#2f2484]">{a.title}</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No announcements yet.</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <Link href="/check-in">
          <button className="bg-yellow-400 hover:bg-yellow-300 text-[#2f2484] font-semibold px-6 py-3 rounded-full shadow-md transition">
            Check In Now
          </button>
        </Link>

        <Link href="/main">
          <button className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-full shadow-md transition">
            Go to Events
          </button>
        </Link>
      </div>
    </main>
  );
}
