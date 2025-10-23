"use client";

import { Member } from "@/types/pinya";
import { useDrag } from "react-dnd";
import { useRef, useEffect } from "react";

type AttendanceMemberProps = {
  member: Member;
};

export default function AttendanceMember({ member }: AttendanceMemberProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "MEMBER",
    item: member,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (ref.current) drag(ref.current);
  }, [drag]);

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="bg-gray-200 px-3 py-2 rounded shadow text-sm cursor-grab select-none w-full text-center mb-1"
    >
      <span className="font-semibold">{member.nickname}</span>
      <br />
      <span className="text-xs text-gray-500">{member.position || "No role"}</span>
    </div>
  );
}
