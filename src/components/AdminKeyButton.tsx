"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminKeyButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/admin")}
      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition"
    >
      <KeyRound className="w-6 h-6 text-gray-700" />
    </button>
  );
}
