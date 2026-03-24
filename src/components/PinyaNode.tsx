"use client";

import { Handle, Position } from "reactflow";
import { Member } from "@/types/pinya";
import { useDrop, useDrag } from "react-dnd";
import { useRef, useEffect, useState } from "react";

// Helper for contrast
const getContrastColor = (hexColor: string) => {
  if (!hexColor?.startsWith("#") || hexColor.length !== 7) return "#fff";
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#000" : "#fff";
};

type PinyaNodeProps = {
  data: {
    id: string;
    label: string;
    member?: Member & { colla?: string; collaColor?: string }; // include colla info
    rotation?: number;
    onRotate?: () => void;
    onAssign?: (member: Member) => void;
    onRemove?: () => void;
    checkedIn?: boolean;
    highlight?: boolean;
    rsvpComing?: boolean;
    showRotateButton?: boolean;
    mode?: "all" | "checkedin" | "rsvp";
    late?: boolean;
    
  };
};

export default function PinyaNode({ data }: PinyaNodeProps) {
  const rotation = data.rotation ?? 0;
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(14);

  const [{ isDragging }, drag] = useDrag({
    type: "ROLE_NODE",
    item: { nodeId: data.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "MEMBER",
    drop: (item: Member) => data.onAssign?.(item),
    canDrop: () => !data.member,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  useEffect(() => {
    const el = ref.current;
    if (el) {
      const timeout = setTimeout(() => {
        try {
          drag(el);
          drop(el);
        } catch (err) {
          console.warn("DnD setup failed:", err);
        }
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [drag, drop]);

  // --- Background & text color ---
  const bgStyle: React.CSSProperties = {};
  const textStyle: React.CSSProperties = {};

  if (data.member?.collaColor) {
    bgStyle.backgroundColor = data.member.collaColor;
    textStyle.color = getContrastColor(data.member.collaColor);
  } else if (data.highlight) {
    bgStyle.backgroundColor = "#facc15"; // yellow-500
    textStyle.color = "#000";
  } else if (data.member) {
  if (data.member.position?.toLowerCase() === "new")
    bgStyle.backgroundColor = "#22c55e"; // green-500
  else if (data.label === "Baix")
    bgStyle.backgroundColor = "#dc2626"; // red-600
  else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
    bgStyle.backgroundColor = "#facc15"; // yellow-400
    textStyle.color = "#000";
  } else {
    bgStyle.backgroundColor = "#3b82f6"; // blue-500
    textStyle.color = "#fff"; // ✅ FIX
  }

  } else {
    if (data.label === "Baix") bgStyle.backgroundColor = "#dc2626";
    else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
      bgStyle.backgroundColor = "#facc15";
      textStyle.color = "#000";
    } else bgStyle.backgroundColor = "#9ca3af"; // gray-400
    textStyle.color = "#fff";
  }

  // --- Font size ---
  const smallRoles = ["Agulla", "Crossa", "Contrafort", "Tap"];
  const baseFont = smallRoles.includes(data.label) ? 12 : 14;

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const maxWidth = 65;
    let current = baseFont;
    el.style.fontSize = `${current}px`;
    while (el.scrollWidth > maxWidth && current > 8) {
      current -= 1;
      el.style.fontSize = `${current}px`;
    }
    setFontSize(current);
  }, [data.member?.nickname, data.label]);

  // --- Member display name with colla initials ---
  const displayName = data.member
    ? `${data.member.nickname}${
        data.member.colla
          ? ` (${data.member.colla.split(" ").map((w) => w[0]).join("")})`
          : ""
      }`
    : data.label;
console.log("NODE DEBUG:", {
  label: data.label,
  member: data.member?.nickname,
  checkedIn: data.checkedIn,
  rsvpComing: data.rsvpComing,
});
  return (
    <div
      ref={ref}
      style={{
        ...bgStyle,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        border: isOver && canDrop
  ? "2px dashed green"
  : data.mode === "checkedin" && data.checkedIn
  ? "3px solid #22c55e"
  : data.mode === "rsvp" && data.rsvpComing
  ? data.late
    ? "3px dashed #f97316"
    : "3px solid #f97316"
  : "2px solid transparent",

boxShadow:
  data.mode === "checkedin" && data.checkedIn
    ? "0 0 10px rgba(34,197,94,0.6)"
    : "none",
      }}
      className="relative flex flex-col items-center justify-center px-2 py-1 rounded shadow cursor-pointer select-none min-w-[70px] min-h-[40px] transition-all duration-200"
      onClick={() => data.member && data.onRemove?.()}
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px`, ...textStyle }}
        className="font-semibold leading-tight text-center whitespace-nowrap"
      >
        {displayName}
      </span>

      {data.showRotateButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onRotate?.();
          }}
          className="absolute -top-2 -right-2 bg-white text-black rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
        >
          ⟳
        </button>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
}
