"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminKeyButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/admin")}
      className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-700 shadow-md hover:bg-[#2f2484] hover:text-yellow-400 transition-colors duration-200"
    >
      <KeyRound className="w-6 h-6" />
    </button>
  );
}
