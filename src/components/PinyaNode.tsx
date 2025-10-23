"use client";

import { Handle, Position } from "reactflow";
import { Member } from "@/types/pinya";
import { useDrop } from "react-dnd";
import { useRef, useEffect, useMemo } from "react";

type PinyaNodeProps = {
  data: {
    label: string;
    member?: Member;
    rotation?: number;
    onRotate?: () => void;
    onAssign?: (member: Member) => void;
    onRemove?: () => void;
  };
};

export default function PinyaNode({ data }: PinyaNodeProps) {
  const rotation = data.rotation ?? 0;
  const ref = useRef<HTMLDivElement | null>(null);

  // Drop target
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
    if (ref.current) drop(ref.current);
  }, [drop]);

  // Determine classes / sizes based on role (label)
  const { bgClass, widthClass, heightClass, fontClass } = useMemo(() => {
    const label = (data.label || "").toLowerCase();

    if (label === "baix") {
      return { bgClass: "bg-red-600", widthClass: "w-24", heightClass: "h-14", fontClass: "text-sm" };
    }

    const blueRoles = ["vent", "mans", "lateral", "diagonal", "tap", "crossa", "contrafort", "agulla"];
    if (blueRoles.includes(label)) {
      const isSmall = ["contrafort", "agulla", "crossa"].includes(label);
      return {
        bgClass: "bg-blue-600",
        widthClass: isSmall ? "w-20" : "w-24",
        heightClass: isSmall ? "h-11" : "h-14",
        fontClass: isSmall ? "text-xs" : "text-sm",
      };
    }

    const goldRoles = ["tronc", "dosos", "acotxadora", "enxaneta"];
    if (goldRoles.includes(label)) {
      return { bgClass: "bg-amber-600", widthClass: "w-22", heightClass: "h-12", fontClass: "text-sm" };
    }

    return { bgClass: "bg-gray-500", widthClass: "w-22", heightClass: "h-12", fontClass: "text-sm" };
  }, [data.label]);

  return (
    <div
      ref={ref}
      // only rotation in style.transform
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        border: isOver && canDrop ? "2px dashed rgba(16,185,129,0.9)" : undefined,
      }}
      className={`relative flex flex-col items-center justify-center ${bgClass} text-white rounded-md shadow cursor-pointer select-none ${widthClass} ${heightClass}`}
      onClick={() => data.member && data.onRemove?.()}
    >
      <div className={`font-semibold ${fontClass} text-center`}>{data.label}</div>

      {data.member && (
        <div className="text-[11px] text-white/90 mt-1 text-center leading-tight">
          {data.member.nickname}
          <br />
          <span className="text-[10px] opacity-80">{data.member.position || ""}</span>
        </div>
      )}

      {/* rotate button stays unrotated visually by counter-rotating */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onRotate?.();
        }}
        className="absolute -top-2 -right-2 bg-white text-black rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
        // counter-rotate so button stays upright
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        ⟳
      </button>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
}
