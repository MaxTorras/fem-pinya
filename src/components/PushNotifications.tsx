"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function PushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // must be server key to insert safely
    );

    const subscribeUserToPush = async () => {
      if (!("Notification" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      try {
        const registration = await navigator.serviceWorker.ready;
        // Inside subscribeUserToPush
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  ),
});

// Send to your server
const res = await fetch("/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(subscription.toJSON()), // send plain object
});

if (!res.ok) throw new Error("Failed to save subscription");
console.log("Subscription sent to server ✅");

      } catch (err) {
        console.error("Push subscription failed:", err);
      }
    };

    navigator.serviceWorker.register("/sw.js").then(() => {
      console.log("Service Worker registered");
      subscribeUserToPush();
    });
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
