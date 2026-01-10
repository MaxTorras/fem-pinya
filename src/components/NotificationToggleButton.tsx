"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export default function NotificationToggleButton() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if user already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        console.log("Existing subscription:", sub);
        if (sub) setEnabled(true);
      });
    });
  }, []);

  const toggleNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications not supported in this browser.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!enabled) {
        // Enable notifications
        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);
        if (permission !== "granted") {
          alert("Permission denied!");
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });

        console.log("New subscription object:", subscription);

        // Save subscription to Supabase
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        const data = await res.json();
        console.log("Response from /api/subscribe:", data);

        if (!res.ok) throw new Error("Failed to save subscription");

        setEnabled(true);
        alert("Notifications enabled!");
      } else {
        // Disable notifications
        const subscription = await registration.pushManager.getSubscription();
        console.log("Subscription to unsubscribe:", subscription);

        if (subscription) {
          await subscription.unsubscribe();

          // Delete from Supabase
          const res = await fetch("/api/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });

          const data = await res.json();
          console.log("Response from /api/unsubscribe:", data);

          if (!res.ok) throw new Error("Failed to remove subscription");

          setEnabled(false);
          alert("Notifications disabled!");
        }
      }
    } catch (err: any) {
      console.error("Notification error:", err);
      alert("Error: " + (err.message || err));
    }
  };

  return (
    <button
      onClick={toggleNotifications}
      className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800 transition"
    >
      {enabled ? "Disable Notifications" : "Enable Notifications"}
    </button>
  );
}
