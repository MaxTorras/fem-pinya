"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

type Member = {
  nickname: string;
  name?: string;
  surname?: string;
  position?: string;
};

export default function CheckIn() {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  // Fetch existing members for suggestions
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error("Failed to fetch members", err);
      }
    };
    fetchMembers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    const query = e.target.value.toLowerCase();

    // Only use nicknames for suggestions
    setSuggestions(
      members
        .map((m) => m.nickname)
        .filter((n) => n.toLowerCase().includes(query) && query.length > 0)
    );
  };

  const handleSelectSuggestion = (name: string) => {
    setNickname(name);
    setSuggestions([]);
  };
  

  const handleSubmit = async () => {
    if (!nickname) {
      setStatus("⚠️ Please enter your nickname.");
      return;
    }

    setLoading(true);
  setStatus("");
  const params = new URLSearchParams(window.location.search);
  const date = params.get("date") || new Date().toISOString().split("T")[0]; // only date part

   try {
    // 1️⃣ Fetch current attendance for that day
    const attendanceRes = await fetch(`/api/attendance?date=${date}`);
    const attendanceData = await attendanceRes.json();

    const alreadyCheckedIn = attendanceData.records?.some(
      (r: { nickname: string }) =>
        r.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (alreadyCheckedIn) {
      setStatus("⚠️ You’ve already checked in today!");
      setLoading(false);
      return;
    }

    // 2️⃣ Proceed to check in
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNickname: nickname, date }),
    });

    if (res.ok) {
      setStatus("✅ Attendance recorded!");
      setNickname("");
      setSuggestions([]);
    } else {
      const data = await res.json();
      setStatus(`❌ ${data.error || "Try again"}`);
    }
  } catch (err) {
    console.error(err);
    setStatus("🚨 Network error.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main
      className={`${quicksand.className} flex flex-col items-center p-6 min-h-screen bg-white`}
    >
      <h1 className="text-3xl font-bold text-[#2f2484] mb-6">Check In</h1>

      <input
        type="text"
        placeholder="Your nickname"
        value={nickname}
        onChange={handleChange}
        className="border-2 border-[#2f2484] rounded p-3 w-64 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />

      {suggestions.length > 0 && (
        <ul className="border border-[#2f2484] rounded w-64 max-h-32 overflow-auto bg-white z-10 mt-2 shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s}
              className="p-2 cursor-pointer hover:bg-yellow-100"
              onClick={() => handleSelectSuggestion(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#2f2484] text-white px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition"
        >
          {loading ? "Submitting..." : "Check In"}
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-yellow-100 transition"
        >
          Edit Profile
        </button>
      </div>

      {status && (
        <p
          className={`mt-4 font-medium ${
            status.includes("✅")
              ? "text-green-600"
              : status.includes("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {status}
        </p>
      )}
    </main>
  );
}
