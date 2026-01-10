"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react"; // Lucide icons

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme =
      saved === "light"
        ? "light"
        : saved === "dark"
        ? "dark"
        : systemDark
        ? "dark"
        : "light";

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);

    setTheme(saved ?? "system");
  }, []);

  // React to system changes if mode is "system"
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = () => {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved === "system" || !saved) {
        document.documentElement.classList.toggle("dark", media.matches);
        document.documentElement.classList.toggle("light", !media.matches);
      }
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const resolvedTheme =
      newTheme === "system"
        ? systemDark
          ? "dark"
          : "light"
        : newTheme;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);

    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
      <button
        onClick={() => applyTheme("light")}
        className={`p-2 transition ${theme === "light" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>

      <button
        onClick={() => applyTheme("system")}
        className={`p-2 transition ${theme === "system" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
        aria-label="System mode"
      >
        <Monitor size={18} />
      </button>

      <button
        onClick={() => applyTheme("dark")}
        className={`p-2 transition ${theme === "dark" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
    </div>
  );
}
