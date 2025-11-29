"use client";

export default function TrashBin() {
  return (
    <div
      id="trash-bin"
      className="
        fixed bottom-6 
        right-6                 /* 📱 Mobile */
        md:right-[340px]        /* 🖥 Desktop (further left than before) */
        w-16 h-16
        bg-red-600
        rounded-full
        flex items-center justify-center
        text-white text-2xl font-bold
        shadow-xl
        z-50
        hover:bg-red-700 transition
      "
    >
      🗑️
    </div>
  );
}
