"use client";
import { useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import { User, LogOut, Settings } from "lucide-react";

export default function HeaderClient() {
  const { user, setUser } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Logged out button
  if (!user)
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-4 py-2 bg-yellow-400 text-[#2f2484] font-semibold rounded hover:bg-yellow-300 transition"
      >
        Log In
      </button>
    );

  // Logged in dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 bg-yellow-400 text-[#2f2484] font-semibold rounded hover:bg-yellow-300 transition"
      >
        <User size={18} /> {user.nickname}
      </button>

      {open && (
  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border z-50">
    <button
      onClick={() => router.push("/profile")}
      className="w-full px-4 py-2 flex items-center gap-2 text-[#2f2484] dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-700 transition"
    >
      <Settings size={16} /> Edit Profile
    </button>

    <button
      onClick={() => {
        setUser(null);
        localStorage.removeItem("pinyaUser");
        router.push("/login");
      }}
      className="w-full px-4 py-2 flex items-center gap-2 text-[#2f2484] dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-700 transition"
    >
      <LogOut size={16} /> Log Out
    </button>
  </div>
)}

    </div>
  );
}
