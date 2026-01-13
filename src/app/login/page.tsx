"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { UserContext } from "@/context/UserContext";

type Member = {
  nickname: string;
  name?: string;
  surname?: string;
};

type MembersResponse = {
  members: Member[];
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useContext(UserContext);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // 🔹 added (suggestions only)
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);

  // 🔹 added (fetch members)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await res.json();

    if (data.success) {
      const userData = {
        nickname: data.nickname,
        name: data.name,
        surname: data.surname,
        position: data.position,
        position2: data.position2,
        isAdmin: data.isAdmin,
      };
      setUser(userData);
      if (remember) localStorage.setItem("pinyaUser", JSON.stringify(userData));
      router.push("/");
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 mx-4">
        <h1 className="text-3xl font-bold text-center text-[#2f2484] mb-2">
          Fem Pinya
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Log in to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          {/* Nickname with suggestions */}
          <div className="relative">
            <input
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => {
                const val = e.target.value;
                setNickname(val);

                if (!val.trim()) {
                  setSuggestions([]);
                  return;
                }

                const query = val.toLowerCase();
                setSuggestions(
                  members.filter((m) => {
                    const fullName = `${m.name || ""} ${m.surname || ""}`.toLowerCase();
                    return (
                      m.nickname.toLowerCase().includes(query) ||
                      fullName.includes(query)
                    );
                  })
                );
              }}
              required
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f2484]"
            />

            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 max-h-40 overflow-auto shadow-lg">
                {suggestions.map((m) => (
                  <li
                    key={m.nickname}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setNickname(m.nickname);
                      setSuggestions([]);
                    }}
                  >
                    {m.nickname}
                    {m.name || m.surname
                      ? ` (${m.name || ""} ${m.surname || ""})`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            type="password"
            placeholder="default password: fempinya"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f2484]"
          />

          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-gray-400"
            />
            Remember this device
          </label>

          <button
            type="submit"
            className="w-full bg-[#2f2484] text-yellow-400 py-2 rounded-lg font-semibold hover:bg-[#3c32a1] transition flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Log In
          </button>
        </form>
      </div>
    </div>
  );
}
