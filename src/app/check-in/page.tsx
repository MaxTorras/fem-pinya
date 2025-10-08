"use client";

import { useState, useEffect } from "react";

export default function CheckIn() {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
    setSuggestions(
      members.filter((m) => m.toLowerCase().includes(query) && query.length > 0)
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
    const date = params.get("date") || new Date().toISOString();

    try {
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
    } catch {
      setStatus("🚨 Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-6">
      <h1 className="text-2xl font-bold">Check In</h1>

      <input
        type="text"
        placeholder="Your nickname"
        value={nickname}
        onChange={handleChange}
        className="border rounded p-2 w-64 text-center"
      />

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <ul className="border rounded w-64 max-h-32 overflow-auto bg-white z-10">
          {suggestions.map((s) => (
            <li
              key={s}
              className="p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => handleSelectSuggestion(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
      >
        {loading ? "Submitting..." : "Check In"}
      </button>

      {status && <p className="text-center">{status}</p>}
    </div>
  );
}
