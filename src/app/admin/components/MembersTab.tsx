// src/app/admin/components/MembersTab.tsx
"use client";

type Member = { nickname: string; name?: string; surname?: string };

export default function MembersTab({ members }: { members: Member[] }) {
  return (
    <ul className="border-2 border-[#2f2484] rounded divide-y">
      {members.map((m) => (
        <li key={m.nickname} className="p-3">
          <span className="font-semibold">{m.nickname}</span>
          {(m.name || m.surname) && (
            <span className="text-gray-500 text-sm ml-2">
              ({m.name || ""} {m.surname || ""})
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
