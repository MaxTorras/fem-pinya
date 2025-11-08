"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, LogIn } from "lucide-react";

type PinyaUser = {
  nickname: string;
  name?: string;
  surname?: string;
  position?: string;
  position2?: string;
};

export default function HeaderClient() {
  const router = useRouter();
  const [user, setUser] = useState<PinyaUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pinyaUser");
      if (stored && stored !== "undefined" && stored !== "null") {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem("pinyaUser");
    }
  }, []);

  // Click outside to close menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pinyaUser");
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  };

  return (
    <div className="ml-auto relative flex items-center" ref={menuRef}>
      {!user ? (
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 px-3 py-2 bg-yellow-400 text-[#2f2484] rounded-lg font-semibold hover:bg-yellow-300 transition"
        >
          <LogIn size={18} /> Login
        </button>
      ) : (
        <>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 bg-yellow-400 text-[#2f2484] px-3 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition"
          >
            <User size={18} />
            <span>{user.nickname}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/profile");
                }}
                className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Settings size={16} /> Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
