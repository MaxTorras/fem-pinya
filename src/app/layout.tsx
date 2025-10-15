import "./globals.css";
import AdminKeyButton from "@/components/AdminKeyButton";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400","600","700"] });

export const metadata = {
  title: "Fem Pinya",
  description: "Colla Castellera Edinburgh Attendance App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${quicksand.className} relative min-h-screen bg-gray-50 text-gray-900`}>
        {/* Fixed header */}
        <header className="flex items-center bg-[#2f2484] text-white p-4 shadow-md">
          <img src="/logo.png" alt="Colla Logo" className="h-10 w-auto mr-3" />
          <h1 className="font-semibold text-lg">Colla Castellera d'Edinburgh</h1>
        </header>

        {/* Admin key button (floating) */}
        <AdminKeyButton />

        {/* Page content with padding to avoid header overlap */}
        <main className="pt-20 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
