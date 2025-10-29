"use client";

import { Handle, Position } from "reactflow";
import { Member } from "@/types/pinya";
import { useDrop, useDrag } from "react-dnd";
import { useRef, useEffect, useState } from "react";

type PinyaNodeProps = {
  data: {
    id: string;
    label: string;
    member?: Member;
    rotation?: number;
    onRotate?: () => void;
    onAssign?: (member: Member) => void;
    onRemove?: () => void;
    checkedIn?: boolean;
    highlight?: boolean; // ✅ highlight search match
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

  // Determine background and text color
  // Determine background and text color
let bgColor = "bg-gray-400";
let textColor = "text-white";

if (data.highlight) {
  bgColor = "bg-yellow-500"; // gold highlight if searched
  textColor = "text-black";
} else if (data.member) {
  if (data.member.position?.toLowerCase() === "new") {
    bgColor = "bg-green-500";
  } else if (data.label === "Baix") {
    bgColor = "bg-red-600";
  } else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
    bgColor = "bg-yellow-400";
    textColor = "text-black";
  } else {
    bgColor = "bg-blue-500";
  }
} else {
  if (data.label === "Baix") bgColor = "bg-red-600";
  else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
    bgColor = "bg-yellow-400";
    textColor = "text-black";
  }
}


  // ✅ Override background if highlighted
  if (data.highlight) {
    bgColor = "bg-yellow-500"; // gold-ish color
    textColor = "text-black";
  }

  // Smaller font for compact roles
  const smallRoles = ["Agulla", "Crossa", "Contrafort", "Tap"];
  const baseFont = smallRoles.includes(data.label) ? 12 : 14;

  // Auto-resize nickname if needed
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

  return (
    <div
      ref={ref}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        border: isOver && canDrop
          ? "2px dashed green"
          : data.checkedIn
          ? "3px solid #22c55e"
          : "2px solid transparent",
        boxShadow: data.checkedIn
          ? "0 0 10px rgba(34,197,94,0.6)"
          : "none",
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`relative flex flex-col items-center justify-center ${bgColor} ${textColor} px-2 py-1 rounded shadow cursor-pointer select-none min-w-[70px] min-h-[40px] transition-all duration-200`}
      onClick={() => data.member && data.onRemove?.()}
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className="font-semibold leading-tight text-center whitespace-nowrap"
      >
        {data.member ? data.member.nickname : data.label}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onRotate?.();
        }}
        className="absolute -top-2 -right-2 bg-white text-black rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
      >
        ⟳
      </button>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
}
