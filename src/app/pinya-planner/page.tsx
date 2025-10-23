"use client";

import { useState, useEffect } from "react";
import ReactFlow, { Node, applyNodeChanges, Background, Controls, OnNodesChange } from "reactflow";
import "reactflow/dist/style.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PinyaNode from "@/components/PinyaNode";
import AttendanceMember from "@/components/AttendanceMember";
import { Member, PinyaLayout } from "@/types/pinya";
import TrashBin from "@/components/TrashBin"; // we'll define this component below
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";

type AttendanceRecord = {
  nickname: string;
};

const nodeTypes = { pinya: PinyaNode };

const quickRoles = [
  "Vent","Mans","Baix","Contrafort","Agulla","Crossa","Lateral",
  "Diagonal","Tap","Tronc","Dosos","Acotxadora","Enxaneta",
];

export default function PinyaPlannerPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Member[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<PinyaLayout[]>([]);
  const [layoutName, setLayoutName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  // Load members
  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => setMembers(data.members));
  }, []);

  // Load attendance for selected date
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/attendance?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        const presentMembers = data.records
          .map((r: AttendanceRecord) => members.find((m) => m.nickname === r.nickname))
          .filter(Boolean) as Member[];
        setAttendance(presentMembers);
      });
  }, [selectedDate, members]);

  // Assign / remove members
  const assignMemberToNode = (nodeId: string, member: Member) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, member } } : n))
    );
    setAttendance((prev) => prev.filter((m) => m.nickname !== member.nickname));
  };

  const removeMemberFromNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.data?.member) return;
    setAttendance((prev) => [...prev, node.data.member]);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, member: undefined } } : n
      )
    );
  };

  // Rotate node
  const rotateNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, rotation: ((n.data.rotation || 0) + 45) % 360 } }
          : n
      )
    );
  };

  // Save / Load layouts
  const saveLayout = () => {
    if (!layoutName.trim()) return alert("Please name your layout!");
    const layout: PinyaLayout = {
      id: Date.now().toString(),
      name: layoutName,
      castellType: "4d7",
      positions: nodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        x: n.position.x,
        y: n.position.y,
        member: n.data.member,
        rotation: n.data.rotation || 0,
      })),
    };
    const updated = [...savedLayouts, layout];
    setSavedLayouts(updated);
    localStorage.setItem("pinyaLayouts", JSON.stringify(updated));
    setLayoutName("");
    alert("Layout saved!");
  };

  const loadLayout = (layout: PinyaLayout) => {
    const loadedNodes: Node[] = layout.positions.map((p) => ({
      id: p.id,
      type: "pinya",
      position: { x: p.x, y: p.y },
      data: { label: p.label, member: p.member, rotation: p.rotation || 0 },
    }));
    setNodes(loadedNodes);
  };

  // Add new role
  const addRole = (role: string) => {
    const id = `${role.toLowerCase()}_${Date.now()}`;
    setNodes((prev) => [
      {
        id,
        type: "pinya",
        position: { x: 400, y: Math.max(50, 100 - prev.length * 50) },
        data: { label: role, rotation: 0 },
      },
      ...prev, // new role on top
    ]);
  };

  

  const onNodesChange: OnNodesChange = (changes) =>
    setNodes((nds) => applyNodeChanges(changes, nds));

  // Nodes with handlers
  const nodesWithHandlers = nodes.map((n) => ({
    ...n,
    key: `${n.id}_${n.data.rotation || 0}`,
    data: {
      ...n.data,
      onAssign: (m: Member) => assignMemberToNode(n.id, m),
      onRemove: () => removeMemberFromNode(n.id),
      onRotate: () => rotateNode(n.id),
    },
  }));

  // Organize members by position
  const positionsMap: Record<string, Member[]> = {};
  attendance.forEach((m) => {
    const key = m.position || "No role";
    if (!positionsMap[key]) positionsMap[key] = [];
    positionsMap[key].push(m);
  });

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen w-full relative">
        {/* LEFT PANEL */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-2 border-b bg-white sticky top-0 z-10">
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Select date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded p-1 w-full text-xs"
              />
            </div>

           

            <div>
              <input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="Layout name"
                className="border rounded p-1 w-full text-xs mb-1"
              />
              <button
                onClick={saveLayout}
                className="bg-blue-600 text-white px-2 py-1 rounded w-full text-xs mb-2"
              >
                💾 Save Layout
              </button>

              <div className="max-h-24 overflow-y-auto">
                {savedLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => loadLayout(layout)}
                    className="border px-2 py-1 rounded w-full text-xs mb-1 text-left hover:bg-gray-100"
                  >
                    {layout.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
            {Object.keys(positionsMap).map((pos) => (
              <div key={pos} className="mb-4">
                <h3 className="font-bold text-sm mb-1">{pos}</h3>
                {positionsMap[pos].map((member) => (
                  <AttendanceMember key={member.nickname} member={member} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 border p-2 relative">
         <ReactFlow
  nodes={nodesWithHandlers}
  onNodesChange={onNodesChange}
  nodeTypes={nodeTypes}
  fitView
  onNodeDragStop={(event, node) => {
    const trash = document.getElementById("trash-bin");
    if (!trash) return;

    const rect = trash.getBoundingClientRect();
    const clientEvent = event as unknown as MouseEvent | TouchEvent;
const x =
  (clientEvent as MouseEvent).clientX ??
  (clientEvent as TouchEvent).touches?.[0]?.clientX;
const y =
  (clientEvent as MouseEvent).clientY ??
  (clientEvent as TouchEvent).touches?.[0]?.clientY;


    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      setNodes((prev) => prev.filter((n) => n.id !== node.id));
    }
  }}
>
  <Background />
  <Controls />
</ReactFlow>

{/* Trash Bin inside DndProvider */}
<TrashBin />

</div> {/* ✅ <-- This was missing */}
        {/* RIGHT QUICK ROLE PANEL */}
        <div className="fixed top-4 right-4 bg-white rounded-xl shadow-md p-3 flex flex-col gap-2 max-h-[90vh] overflow-auto z-50 w-40">
          <h3 className="font-semibold text-center mb-1 text-sm">Add Role</h3>
          {quickRoles.map((role) => (
            <button
              key={role}
              onClick={() => addRole(role)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
            >
              + {role}
            </button>
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
