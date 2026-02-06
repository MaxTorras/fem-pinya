"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";
import { UserContext } from "@/context/UserContext";

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
  const { user } = useContext(UserContext);
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const router = useRouter();

  const isLoggedIn = !!user;
  const isCheckingInAsSomeoneElse =
    isLoggedIn &&
    nickname.toLowerCase() !== user.nickname.toLowerCase();

    const normalizeNickname = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " "); // turns "Max   Torras" into "Max Torras"


  // Sync nickname once user is available (without overwriting edits)
  useEffect(() => {
    if (user && nickname === "") {
      setNickname(user.nickname);
    }
  }, [user]);

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
  const raw = e.target.value;
  setNickname(raw);

  const query = normalizeNickname(raw).toLowerCase();

  setSuggestions(
    members.filter((m) => {
      const nicknameNorm = normalizeNickname(m.nickname).toLowerCase();
      const fullName = normalizeNickname(
        `${m.name || ""} ${m.surname || ""}`
      ).toLowerCase();

      return (
        nicknameNorm.includes(query) ||
        fullName.includes(query)
      );
    })
  );
};


  const handleSelectSuggestion = (member: Member) => {
    setNickname(member.nickname);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
  const normalizedNickname = normalizeNickname(nickname);

  if (!normalizedNickname) {
    setStatus("⚠️ Please enter your nickname.");
    return;
  }


    setLoading(true);
    setStatus("");
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date") || new Date().toISOString().split("T")[0];

    try {
      const attendanceRes = await fetch(`/api/attendance?date=${date}`);
      const attendanceData = (await attendanceRes.json()) as AttendanceResponse;

      const alreadyCheckedIn = attendanceData.records?.some(
  (r) =>
    normalizeNickname(r.nickname).toLowerCase() ===
    normalizedNickname.toLowerCase()
);


      if (alreadyCheckedIn) {
        setStatus("⚠️ You’ve already checked in today!");
        setLoading(false);
        return;
      }

      const memberExists = members.some(
  (m) =>
    normalizeNickname(m.nickname).toLowerCase() ===
    normalizedNickname.toLowerCase()
);


      if (!memberExists) {
        const newMember: Member = {
  nickname: normalizedNickname,
  passwordHash: "$2b$10$nb52dsdl53wetP/7FFQaKepcd8a9BlA1skSW4ZfgpESEJJbqGrO0W",
  position: "New",
};


        const addMemberRes = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMember),
        });

        if (!addMemberRes.ok) {
          const errData = (await addMemberRes.json()) as ErrorResponse;
          setStatus(
            `❌ Failed to add new member: ${errData.error || "Try again"}`
          );
          setLoading(false);
          return;
        }

        setMembers((prev) => [...prev, newMember]);
      }

      const checkInRes = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNickname: normalizedNickname, date }),

      });

      if (checkInRes.ok) {
        setStatus("✅ Attendance recorded!");
        if (!user) setNickname("");
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
    <main
      className={`${quicksand.className} flex flex-col items-center p-6 min-h-screen bg-white dark:bg-zinc-900`}
    >
      <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400 mb-6">Check In</h1>

      <input
        type="text"
        placeholder="Who are you?"
        value={nickname}
        onChange={handleChange}
        className="
  border-2 border-[#2f2484]
  dark:border-yellow-400
  rounded p-3 w-64 text-center
  bg-white dark:bg-zinc-800
  text-black dark:text-white
  placeholder:text-gray-500 dark:placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-yellow-400
"

      />

      {user && (
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Logged in as {user.nickname} ({user.name} {user.surname})
        </p>
      )}

      {user && nickname !== user.nickname && (
        <button
          onClick={() => {
            setNickname(user.nickname);
            setSuggestions([]);
          }}
          className="mt-2 text-sm text-[#2f2484] dark:text-yellow-400 underline hover:text-yellow-500"

        >
          Use my nickname
        </button>
      )}

      {suggestions.length > 0 && (
        <ul className="
  border border-[#2f2484]
  dark:border-yellow-400
  rounded w-64 max-h-32 overflow-auto
  bg-white dark:bg-zinc-800
  text-black dark:text-white
  z-10 mt-2 shadow-lg
">

          {suggestions.map((m) => (
            <li
              key={m.nickname}
              className="p-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-zinc-700"
              onClick={() => handleSelectSuggestion(m)}
            >
              {m.nickname}{" "}
              {m.name || m.surname
                ? `(${m.name || ""} ${m.surname || ""})`
                : ""}
            </li>
          ))}
        </ul>
      )}

      {isCheckingInAsSomeoneElse && (
        <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-400 font-medium text-center">
          ⚠️ You are logged in as <strong>{user.nickname}</strong> but checking in
          as <strong> {nickname}</strong>.
        </p>
      )}

      <div className="flex flex-col gap-4 mt-6 items-center w-full">
        {nickname && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Checking in as <strong>{nickname}</strong>
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#2f2484] text-white px-8 py-3 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition w-64"
        >
          {loading ? "Submitting..." : "Check In"}
        </button>

        <button
          onClick={() => router.push("/pinyes-overview")}
          className="bg-green-600 text-white px-8 py-3 rounded font-semibold hover:bg-green-500 transition w-64"
        >
          View Pinyes Overview
        </button>
      </div>

      {status && (
        <p
          className={`mt-4 font-medium ${
  status.includes("✅")
    ? "text-green-600 dark:text-green-400"
    : status.includes("⚠️")
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-red-600 dark:text-red-400"
}`}
        >
          {status}
        </p>
      )}
    </main>
  );
}
