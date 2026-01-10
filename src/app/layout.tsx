"use client";

import Link from "next/link";
import "./globals.css";
import { Quicksand } from "next/font/google";
import AdminKeyButton from "@/components/AdminKeyButton";
import HeaderClient from "@/components/HeaderClient";
import InstallPrompt from "@/components/InstallPrompt";
import { UserProvider } from "@/context/UserContext";
import PushNotifications from "@/components/PushNotifications";
import { Bell, BellRing } from "lucide-react"; // ✅ two icons

import { useState, useEffect } from "react";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if user is already subscribed
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setNotificationsEnabled(!!sub);
      });
    }
  }, []);

  const handleBellClick = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications not supported in this browser.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!notificationsEnabled) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permission denied!");
          return;
        }

        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });

        setNotificationsEnabled(true);
        alert("Notifications enabled!");
      } else {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
        setNotificationsEnabled(false);
        alert("Notifications disabled!");
      }
    } catch (err: any) {
      console.error("Notification error:", err);
      alert("Error: " + (err.message || err));
    }
  };

  return (
    <html lang="en">
      <head>
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
        <meta name="color-scheme" content="light dark" />
      </head>

      <body className={`${quicksand.className} min-h-screen flex flex-col`}>
        <UserProvider>
          <PushNotifications />

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

              {/* Notification bell */}
              <button
                onClick={handleBellClick}
                className="p-2 rounded-full hover:bg-purple-700 transition touch-manipulation relative"
                title={notificationsEnabled ? "Notifications ON" : "Notifications OFF"}
              >
                {notificationsEnabled ? (
                  <BellRing className="w-6 h-6 text-yellow-400" /> // active state
                ) : (
                  <Bell className="w-6 h-6" /> // inactive state
                )}

                {/* Optional small dot badge */}
                {notificationsEnabled && (
                  <span className="absolute top-0 right-0 block w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>
            </div>
          </header>

          <AdminKeyButton />
          <main className="pt-20 px-4 flex-1 overflow-y-auto">{children}</main>
          <InstallPrompt />
        </UserProvider>
      </body>
    </html>
  );
}

// helper
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
