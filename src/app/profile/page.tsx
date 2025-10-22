"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

type Member = {
  nickname: string;
  passwordHash?: string;
  name?: string;
  surname?: string;
  position?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  // --- Login state ---
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuggestions, setLoginSuggestions] = useState<string[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  // --- Profile state ---
  const [newNickname, setNewNickname] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const [members, setMembers] = useState<Member[]>([]);

  // Fetch all members once on mount
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

  // --- Login autocomplete ---
  const handleLoginNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    if (value.trim() === "") {
      setLoginSuggestions([]);
      return;
    }

    const query = value.toLowerCase();
    const matches = members
      .filter((m) => m.nickname.toLowerCase().includes(query))
      .map((m) => m.nickname);

    setLoginSuggestions(matches);
  };

  const handleSelectLoginSuggestion = (nick: string) => {
    setNickname(nick);
    setLoginSuggestions([]);
  };

  // --- Fetch member data from spreadsheet ---
  const fetchMemberData = async (nick: string) => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      const member = data.members.find(
        (m: Member) => m.nickname.toLowerCase() === nick.toLowerCase()
      );
      return member;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // --- Login handler ---
  const handleLogin = async () => {
    const res = await fetch("/api/profile/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await res.json();

    if (res.ok) {
      setLoggedIn(true);
      setNewNickname(data.nickname);

      // Prefill name & surname from spreadsheet
      const member = await fetchMemberData(data.nickname);
      if (member) {
        setName(member.name || "");
        setSurname(member.surname || "");
      } else {
        setName("");
        setSurname("");
      }

      setMessage("✅ Logged in!");
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

  // --- Profile update handler ---
  const handleUpdate = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match");
      return;
    }

    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldNickname: nickname,
        newNickname,
        name,
        surname,
        oldPassword: oldPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ Profile updated!");
    else setMessage(`❌ ${data.error}`);
  };

  const inputClass =
    "border-2 border-[#2f2484] rounded p-3 w-64 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400";
  const buttonClass = "px-6 py-2 rounded font-semibold transition";

  return (
    <main className={`${quicksand.className} flex flex-col items-center p-6 min-h-screen bg-white`}>
      <h1 className="text-3xl font-bold text-[#2f2484] mb-4">Profile</h1>

      <button
        onClick={() => router.push("/check-in")}
        className={`${buttonClass} bg-gray-200 text-[#2f2484] mb-4 hover:bg-[#2f2484] hover:text-yellow-400`}
      >
        ← Back to Check-In
      </button>

      {!loggedIn ? (
        <>
          {/* Login nickname input with suggestions */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={handleLoginNicknameChange}
              className={inputClass}
            />
            {loginSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 border border-[#2f2484] rounded bg-white max-h-32 overflow-auto z-10 shadow-lg">
                {loginSuggestions.map((s) => (
                  <li
                    key={s}
                    className="p-2 cursor-pointer hover:bg-yellow-100"
                    onClick={() => handleSelectLoginSuggestion(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Default Password: fempinya"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>

          <button
            onClick={handleLogin}
            className={`${buttonClass} bg-[#2f2484] text-white mt-4 hover:bg-yellow-400 hover:text-[#2f2484]`}
          >
            Log In
          </button>
        </>
      ) : (
        <>
          {/* Profile editing form */}
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="Nickname"
            className={inputClass}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Surname"
            className={inputClass}
          />

          <hr className="w-64 my-3 border-gray-300" />
          <h2 className="text-lg font-semibold text-[#2f2484] mb-2">Change Password</h2>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>

          <button
            onClick={handleUpdate}
            className={`${buttonClass} bg-yellow-400 text-[#2f2484] mt-4 hover:bg-[#2f2484] hover:text-yellow-400`}
          >
            Save Changes
          </button>
        </>
      )}

      {message && (
        <p
          className={`mt-4 font-medium ${
            message.includes("✅")
              ? "text-green-600"
              : message.includes("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </main>
  );
}
