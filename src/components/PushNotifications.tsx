// src/components/PushNotifications.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered");
      } catch (err) {
        console.error("SW registration failed:", err);
      }
    };

    const subscribeUserToPush = async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
        console.log("User subscribed to push:", subscription);

        // Store subscription in Supabase
        await supabase.from("push_subscriptions").upsert({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
        });
      } catch (err) {
        console.error("Push subscription failed:", err);
      }
    };

    registerSW();
    subscribeUserToPush();
  }, []);

  return null;
}
