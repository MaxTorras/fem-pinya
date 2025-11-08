"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
  try {
    const savedUser = localStorage.getItem("pinyaUser");
    if (!savedUser) return; // nothing saved

    const parsed = JSON.parse(savedUser);
    if (parsed && parsed.nickname) {
      // valid user
      router.push("/main");
    }
  } catch (err) {
    console.warn("Invalid stored user, clearing localStorage", err);
    localStorage.removeItem("pinyaUser");
  }
}, [router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });

    const data = await res.json();

    if (data.success) {
  if (remember) {
    localStorage.setItem("pinyaUser", JSON.stringify(data));
  }
  router.push("/main");
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              required
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f2484]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f2484]"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-gray-400"
              />
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2f2484] text-yellow-400 py-2 rounded-lg font-semibold hover:bg-[#3c32a1] transition flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Log In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">or</p>
          <button
            className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            onClick={() => alert("Google login coming soon!")}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
