"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function PushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const subscribeUserToPush = async () => {
      if (!("Notification" in window)) return;

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

        // ✅ Save subscription to Supabase
        const { error } = await supabase
          .from("push_subscriptions")
          .insert([{ ...subscription }]); // make sure your table columns match the object

        if (error) console.error("Failed to save subscription:", error);
        else console.log("Subscription saved to Supabase ✅");
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
