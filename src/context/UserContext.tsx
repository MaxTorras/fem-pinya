"use client";
import { createContext, useState, useEffect, ReactNode } from "react";

// ✅ Define User type with isAdmin
export type User = {
  nickname: string;
  name: string;
  surname: string;
  position: string;
  position2: string;
  isAdmin: boolean; // always boolean
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pinyaUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Ensure isAdmin is boolean
        parsed.isAdmin = parsed.isAdmin === true || parsed.isAdmin === "yes";

        setUser(parsed);
      } catch {
        localStorage.removeItem("pinyaUser");
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
