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

  // Drag for trash
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

  // Determine background color
  let bgColor = "bg-blue-500";
  let textColor = "text-white";

  if (data.member) {
    if (data.member.position === "New") {
      bgColor = "bg-green-500";
      textColor = "text-white";
    } else if (data.label === "Baix") {
      bgColor = "bg-red-600";
    } else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
      bgColor = "bg-yellow-400";
      textColor = "text-black";
    } else {
      bgColor = "bg-blue-500";
    }
  } else {
    // If no member assigned, keep role-based color
    if (data.label === "Baix") bgColor = "bg-red-600";
    else if (["Tronc", "Dosos", "Enxaneta", "Acotxadora"].includes(data.label)) {
      bgColor = "bg-yellow-400";
      textColor = "text-black";
    } else bgColor = "bg-blue-500";
  }

  // Determine font size for small roles
  const smallRoles = ["Agulla", "Crossa", "Contrafort", "Tap"];
  const fontSize = smallRoles.includes(data.label) ? "text-sm" : "font-semibold";

  return (
    <div
      ref={ref}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        border: isOver && canDrop ? "2px dashed green" : "none",
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`relative flex flex-col items-center ${bgColor} ${textColor} px-2 py-1 rounded shadow cursor-pointer select-none min-w-[70px] min-h-[40px]`}
      onClick={() => data.member && data.onRemove?.()}
    >
      <span className={fontSize}>
        {data.member ? data.member.nickname : data.label}
      </span>

      {data.member && (
        <span className="text-xs mt-1 text-center">
          {data.member.position || ""}
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
