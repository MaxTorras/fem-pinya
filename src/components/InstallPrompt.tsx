// src/components/InstallPrompt.tsx
"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on mobile
    if (window.innerWidth > 768) return;

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed === "true") return;

    const handler = (e: any) => {
      e.preventDefault(); // Prevent default mini-prompt
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "dismissed") {
      localStorage.setItem("pwa-install-dismissed", "true");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      className="
        fixed bottom-0 left-1/2 -translate-x-1/2 
        bg-[#2f2484] text-white 
        px-4 py-3 rounded-t-xl shadow-xl 
        flex flex-col sm:flex-row items-center gap-3 
        w-full sm:w-[90%] max-w-md z-50
        animate-slideUpFade
      "
    >
      <span className="flex-1 text-center sm:text-left text-sm sm:text-base">
        Install the app for a better experience!
      </span>

      <div className="flex gap-2 mt-2 sm:mt-0">
        <button
          onClick={handleInstallClick}
          className="bg-white text-[#2f2484] px-3 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-sm sm:text-base"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-white opacity-70 hover:opacity-100 transition text-lg sm:text-xl"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
