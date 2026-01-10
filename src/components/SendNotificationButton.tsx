"use client";

export default function SendNotificationButton() {
  const sendNotification = async () => {
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Notification",
          message: "This is a test notification",
          url: "/", // optional: where user will be redirected
        }),
        headers: { "Content-Type": "application/json" },
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
      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
    >
      Send Notification
    </button>
  );
}
