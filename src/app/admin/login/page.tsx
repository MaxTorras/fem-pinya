// src\app\admin\login\page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // auto-login if token already stored
    const token = localStorage.getItem("admin_logged_in");
    if (token === "true") router.replace("/admin");
  }, [router]);

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.setItem("admin_logged_in", "true");
        router.replace("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <div className={`${quicksand.className} flex flex-col items-center justify-center min-h-screen gap-4 bg-white dark:bg-gray-900`}>
      <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400">Admin Login</h1>
      <input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border-2 border-[#2f2484] rounded p-3 w-64 text-center focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-gray-800 dark:text-white"
      />
      <button
        onClick={handleLogin}
        className="bg-[#2f2484] text-yellow-400 px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition"
      >
        Enter
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
