"use client";

import { useEffect } from "react";

export default function PushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
    };

    const subscribeUserToPush = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });

        console.log("User subscribed to push:", subscription);

        // ✅ Send subscription to server API
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()), // plain object
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
