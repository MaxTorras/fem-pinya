"use client";

import { useState, useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function ProfilePage() {
  const { user, setUser } = useContext(UserContext);

  const [newNickname, setNewNickname] = useState(user?.nickname || "");
  const [name, setName] = useState(user?.name || "");
  const [surname, setSurname] = useState(user?.surname || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const inputClass =
    "border-2 border-[#2f2484] rounded p-3 w-64 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400";
  const buttonClass = "px-6 py-2 rounded font-semibold transition";

  if (!user) return <p className={`${quicksand.className} p-6`}>You must be logged in to view this page.</p>;

  const handleUpdate = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldNickname: user.nickname,
          newNickname,
          name,
          surname,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Profile updated!");

        // Update context & localStorage
        const updatedUser = {
          ...user,
          nickname: newNickname,
          name,
          surname,
        };

        setUser(updatedUser);
        localStorage.setItem("pinyaUser", JSON.stringify(updatedUser));

        // Clear passwords
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <main className={`${quicksand.className} flex flex-col items-center p-6 min-h-screen bg-white`}>
      <h1 className="text-3xl font-bold text-[#2f2484] mb-4">Profile</h1>

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
        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
        Show password
      </label>

      <button
        onClick={handleUpdate}
        className={`${buttonClass} bg-yellow-400 text-[#2f2484] mt-4 hover:bg-[#2f2484] hover:text-yellow-400`}
      >
        Save Changes
      </button>

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
