// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      {/* Welcome Card */}
      <div className="bg-[#2f2484] text-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome to Fem Pinya 🚀</h1>
        <p className="text-yellow-300">
          This is the official Colla Castellera Edinburgh attendance app.
        </p>
      </div>

      {/* Info / Quick Start */}
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full border-l-4 border-[#FFD700]">
        <h2 className="text-xl font-semibold mb-2 text-[#2f2484]">Get Started</h2>
        <p className="text-gray-700">
          Use the menu to check in, update your profile, and track attendance.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <Link href="/check-in">
          <button className="bg-yellow-400 hover:bg-yellow-300 text-[#2f2484] font-semibold px-6 py-3 rounded-full shadow-md transition">
            Check In Now
          </button>
        </Link>

        <Link href="/pinya-planner">
          <button className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-full shadow-md transition">
            Go to Pinya Planner
          </button>
        </Link>
      </div>
    </main>
  );
}
