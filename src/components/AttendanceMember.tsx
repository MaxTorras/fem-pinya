"use client";

import { useDrag } from "react-dnd";
import { useRef, useEffect } from "react";
import { Member } from "@/types/pinya";

type AttendanceMemberProps = {
  member: Member;
};

export default function AttendanceMember({ member }: AttendanceMemberProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "MEMBER",
    item: member,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    if (ref.current) drag(ref.current);
  }, [drag]);

  return (
    <div
      ref={ref}
      className={`p-2 mb-1 rounded text-xs cursor-move ${
        isDragging ? "opacity-50" : "opacity-100"
      } bg-white border shadow-sm hover:bg-gray-100`}
    >
      <strong>{member.nickname}</strong>
      {member.name && (
        <span className="text-gray-500 text-[10px] ml-1">
          ({member.name} {member.surname})
        </span>
      )}
    </div>
  );
}
