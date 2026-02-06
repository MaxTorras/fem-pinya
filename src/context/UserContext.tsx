// src\context\UserContext.tsx
"use client";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";

// ✅ Define User type with isAdmin
export type User = {
  nickname: string;
  name: string;
  surname: string;
  position: string;
  position2: string;
  isAdmin: boolean; // always boolean
  id?: string; // 👈 optional unique ID (useful for voting)
   profilePictureUrl?: string;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};

// ✅ Create context
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

// ✅ Provider
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

  // Persist to localStorage when user changes
  useEffect(() => {
    if (user) localStorage.setItem("pinyaUser", JSON.stringify(user));
    else localStorage.removeItem("pinyaUser");
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// ✅ Hook for easier access
export function useUser() {
  return useContext(UserContext);
}
