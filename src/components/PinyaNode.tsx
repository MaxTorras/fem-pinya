"use client";

import { Handle, Position } from "reactflow";
import { Member } from "@/types/pinya";
import { useDrop, useDrag } from "react-dnd";
import { useRef, useEffect } from "react";

type PinyaNodeProps = {
  data: {
    id: string;
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
  const ref = useRef<HTMLDivElement>(null);

  // Draggable for trash
  const [{ isDragging }, drag] = useDrag({
    type: "ROLE_NODE",
    item: { nodeId: data.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  // Drop target for members
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
    if (ref.current) {
      drag(ref.current);
      drop(ref.current);
    }
  }, [drag, drop]);

  // --- COLOR, SIZE & DIMENSIONS ---
  let bgColor = "bg-blue-500"; // default
  if (data.label === "Baix") bgColor = "bg-red-500";
  else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label))
    bgColor = "bg-yellow-500";

  const isSmall = ["Agulla", "Crossa", "Contrafort", "Tap"].includes(data.label);
  const fontSize = isSmall ? "text-xs" : "text-sm";
  const width = isSmall ? "w-16" : "w-20";  // smaller for small nodes
  const height = isSmall ? "h-10" : "h-12";

  return (
    <div
      ref={ref}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        border: isOver && canDrop ? "2px dashed green" : "none",
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`relative flex flex-col items-center ${bgColor} text-white ${width} ${height} px-3 py-2 rounded shadow cursor-pointer select-none`}
      onClick={() => data.member && data.onRemove?.()}
    >
      <span className={`font-semibold ${fontSize} text-center`}>{data.label}</span>

      {data.member && (
        <span className="text-xs text-gray-200 mt-1 text-center">
          {data.member.nickname} <br />
          {data.member.position || "No role"}
        </span>
      )}

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
