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
  passwordHash?: string;
};
type MembersResponse = { members: Member[] };
type AttendanceRecord = { nickname: string; timestamp: string; date: string };
type AttendanceResponse = { records: AttendanceRecord[] };
type ErrorResponse = { error?: string };

export default function CheckIn() {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  // Fetch members for suggestions
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = (await res.json()) as MembersResponse;
        setMembers(data.members || []);
      } catch (err) {
        console.error("Failed to fetch members", err);
      }
    };
    fetchMembers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNickname(val);
    const query = val.toLowerCase();

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
    const date = params.get("date") || new Date().toISOString().split("T")[0];

    try {
      // 1️⃣ Fetch attendance for today
      const attendanceRes = await fetch(`/api/attendance?date=${date}`);
      const attendanceData = (await attendanceRes.json()) as AttendanceResponse;

      const alreadyCheckedIn = attendanceData.records?.some(
        (r) => r.nickname.toLowerCase() === nickname.toLowerCase()
      );

      if (alreadyCheckedIn) {
        setStatus("⚠️ You’ve already checked in today!");
        setLoading(false);
        return;
      }

      // 2️⃣ Check if member exists
      const memberExists = members.some(
        (m) => m.nickname.toLowerCase() === nickname.toLowerCase()
      );

      if (!memberExists) {
        const newMember: Member = { nickname, passwordHash: "", position: "New" };

        const addMemberRes = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMember),
        });

        if (!addMemberRes.ok) {
          const errData = (await addMemberRes.json()) as ErrorResponse;
          setStatus(`❌ Failed to add new member: ${errData.error || "Try again"}`);
          setLoading(false);
          return;
        }

        setMembers((prev) => [...prev, newMember]);
      }

      // 3️⃣ Proceed to check in
      const checkInRes = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNickname: nickname, date }),
      });

      if (checkInRes.ok) {
        setStatus("✅ Attendance recorded!");
        setNickname("");
        setSuggestions([]);
      } else {
        const data = (await checkInRes.json()) as ErrorResponse;
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
    <main className={`${quicksand.className} flex flex-col items-center p-6 min-h-screen bg-white`}>
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

      <div className="flex flex-col gap-4 mt-4 items-center w-full">
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2f2484] text-white px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition w-32"
          >
            {loading ? "Submitting..." : "Check In"}
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-yellow-100 transition w-32"
          >
            Edit Profile
          </button>
        </div>
        <button
          onClick={() => router.push("/pinyes-overview")}
          className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-500 transition w-64"
        >
          View Pinyes Overview
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
