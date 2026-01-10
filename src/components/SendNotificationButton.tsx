// src/components/SendNotificationButton.tsx
"use client"; // needed for client components

export default function SendNotificationButton() {
  const sendNotification = async () => {
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Notification",
          message: "This is a test notification!"
        }),
      });

      if (!res.ok) throw new Error("Failed to send notification");
      alert("Notification sent!");
    } catch (err) {
      console.error(err);
      alert("Error sending notification");
    }
  };

  return (
    <button
      onClick={sendNotification}
      className="bg-yellow-400 text-black px-3 py-1 rounded-md hover:bg-yellow-500 transition"
    >
      Send Notification
    </button>
  );
}
