"use client";
import { useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import { User, LogOut, Settings, Shield } from "lucide-react";

export default function HeaderClient() {
  const { user, setUser } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const PinyaIcon = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Top person */}
    <circle cx="12" cy="4" r="2" />
    <line x1="12" y1="6" x2="12" y2="8" />

    {/* Middle row */}
    <circle cx="8" cy="10" r="2" />
    <line x1="8" y1="12" x2="8" y2="14" />
    <circle cx="16" cy="10" r="2" />
    <line x1="16" y1="12" x2="16" y2="14" />

    {/* Base row */}
    <circle cx="6" cy="16" r="2" />
    <circle cx="12" cy="16" r="2" />
    <circle cx="18" cy="16" r="2" />
  </svg>
);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user)
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-4 py-2 bg-yellow-400 text-[#2f2484] font-semibold rounded hover:bg-yellow-300 transition"
      >
        Log In
      </button>
    );

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

          {user.isAdmin && (
            <>
              <button
                onClick={() => router.push("/admin")}
                className="w-full px-4 py-2 flex items-center gap-2 text-[#2f2484] dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-700 transition"
              >
                <Shield size={16} /> Admin
              </button>

              <button
                onClick={() => router.push("/pinya-planner")}
                className="w-full px-4 py-2 flex items-center gap-2 text-[#2f2484] dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-700 transition"
              >
                <PinyaIcon size={16} /> Pinya Planner
              </button>
            </>
          )}

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
