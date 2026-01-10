// src/app/layout.tsx
"use client"; // ⚠️ Important: this makes the whole layout a client component

import Link from "next/link";
import "./globals.css";
import { Quicksand } from "next/font/google";
import AdminKeyButton from "@/components/AdminKeyButton";
import HeaderClient from "@/components/HeaderClient";
import InstallPrompt from "@/components/InstallPrompt";
import { UserProvider } from "@/context/UserContext";
import PushNotifications from "@/components/PushNotifications";
import SendNotificationButton from "@/components/SendNotificationButton";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2f2484" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Fem Pineapple" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />

        {/* Allow light & dark mode */}
        <meta name="color-scheme" content="light dark" />
      </head>

      <body className={`${quicksand.className} min-h-screen flex flex-col`}>
        <UserProvider>
          {/* Push notifications subscription */}
          <PushNotifications />

          {/* Header */}
          <header
            className="fixed top-0 left-0 w-full flex items-center justify-between
            bg-[#2f2484] text-white p-4 shadow-md z-50"
          >
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:opacity-80 transition">
                <img src="/logo.png" alt="Colla Logo" className="h-10 w-auto" />
              </Link>
              <h1 className="font-semibold text-lg">Colla Castellera Edinburgh</h1>
            </div>

            <div className="flex items-center gap-3">
              <HeaderClient />
              <SendNotificationButton />
            </div>
          </header>

          {/* Admin key button */}
          <AdminKeyButton />

          {/* Main content */}
          <main className="pt-20 px-4 flex-1 overflow-y-auto">{children}</main>

          {/* PWA Install Prompt */}
          <InstallPrompt />
        </UserProvider>
      </body>
    </html>
  );
}
