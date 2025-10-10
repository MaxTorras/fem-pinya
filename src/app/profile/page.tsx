"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [newNickname, setNewNickname] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  // Login
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
      setMessage("✅ Logged in!");
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

  // Update profile
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

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {!loggedIn ? (
        <>
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="border rounded p-2 w-64 text-center"
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded p-2 w-64 text-center"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Log In
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="Nickname"
            className="border rounded p-2 w-64 text-center"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border rounded p-2 w-64 text-center"
          />
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Surname"
            className="border rounded p-2 w-64 text-center"
          />

          <hr className="w-64 my-2 border-gray-300" />
          <h2 className="text-lg font-semibold">Change Password</h2>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="border rounded p-2 w-64 text-center"
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border rounded p-2 w-64 text-center"
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border rounded p-2 w-64 text-center"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show password
          </label>

          <button
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Save Changes
          </button>
        </>
      )}

      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  );
}
