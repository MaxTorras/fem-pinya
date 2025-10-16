import "./globals.css";
import AdminKeyButton from "@/components/AdminKeyButton";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata = {
  title: "Fem Pinya",
  description: "Colla Castellera Edinburgh Attendance App",
  manifest: "/manifest.json",
  themeColor: "#2f2484",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2f2484" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fem Pinya" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
      </head>

      <body className={`${quicksand.className} relative min-h-screen bg-gray-50 text-gray-900`}>
        {/* Fixed header */}
        <header className="flex items-center bg-[#2f2484] text-white p-4 shadow-md">
          <img src="/logo.png" alt="Colla Logo" className="h-10 w-auto mr-3" />
          <h1 className="font-semibold text-lg">Colla Castellera Edinburgh</h1>
        </header>

        {/* Floating admin button */}
        <AdminKeyButton />

        {/* Page content */}
        <main className="pt-20 px-4">{children}</main>
      </body>
    </html>
  );
}
