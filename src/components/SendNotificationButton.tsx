// src\components\SendNotificationButton.tsx
"use client";

export default function SendNotificationButton() {
  const sendNotification = async () => {
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify({
          title: "Fem Pineapple",
          message: "This is a test notification!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to send notification");
      alert("Notification sent!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={sendNotification}
      className="bg-white text-[#2f2484] px-3 py-1 rounded hover:opacity-80 transition"
    >
      Send Notification
    </button>
  );
}
