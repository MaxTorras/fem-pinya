"use client";

import { useState, useEffect } from "react";
import ReactFlow, { Node, applyNodeChanges, Background, Controls, OnNodesChange } from "reactflow";
import "reactflow/dist/style.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";

import PinyaNode from "@/components/PinyaNode";
import AttendanceMember from "@/components/AttendanceMember";
import TrashBin from "@/components/TrashBin";
import { Member, PinyaLayout } from "@/types/pinya";

type AttendanceRecord = { nickname: string };

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
  const [folderName, setFolderName] = useState(""); 
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);

  // Fetch layouts
  const fetchLayouts = async () => {
    try {
      const res = await fetch("/api/layouts");
      const layouts = await res.json();
      setSavedLayouts(layouts);
    } catch (err) {
      console.error("Failed to fetch layouts:", err);
    }
  };
  useEffect(() => { fetchLayouts(); }, []);

  // Load members
  useEffect(() => {
    fetch("/api/members")
      .then(res => res.json())
      .then(data => setMembers(data.members));
  }, []);

  // Load attendance
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/attendance?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        const presentMembers = data.records
          .map((r: AttendanceRecord) => members.find(m => m.nickname === r.nickname))
          .filter(Boolean) as Member[];
        setAttendance(presentMembers);
      });
  }, [selectedDate, members]);

  // Assign / remove
  const assignMemberToNode = (nodeId: string, member: Member) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, member } } : n));
    setAttendance(prev => prev.filter(m => m.nickname !== member.nickname));
  };
  const removeMemberFromNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.data?.member) return;
    setAttendance(prev => [...prev, node.data.member]);
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, member: undefined } } : n));
  };

  // Rotate node
  const rotateNode = (nodeId: string) => {
    setNodes(prev =>
      prev.map(n => n.id === nodeId
        ? { ...n, data: { ...n.data, rotation: ((n.data.rotation || 0) + 45) % 360 } }
        : n
      )
    );
  };

  // 🧠 AUTO ASSIGN FUNCTION
  const handleAutoAssign = () => {
    const available = [...attendance]; // only present members
    const updated = nodes.map((node) => {
      if (node.data.member) return node;

      const matchIndex = available.findIndex(
        (m) => m.position?.toLowerCase() === node.data.label.toLowerCase()
      );

      if (matchIndex !== -1) {
        const matched = available[matchIndex];
        available.splice(matchIndex, 1);
        return {
          ...node,
          data: { ...node.data, member: matched },
        };
      }
      return node;
    });

    setNodes(updated);
    // remove assigned members from attendance
    const remaining = attendance.filter(
      (m) => !updated.some((n) => n.data.member?.nickname === m.nickname)
    );
    setAttendance(remaining);
  };

  // Save layout
  const saveLayout = async () => {
    if (!layoutName.trim()) return alert("Please name your layout!");
    const layout: PinyaLayout = {
      id: Date.now().toString(),
      name: layoutName,
      folder: folderName || undefined,
      castellType: "4d7",
      positions: nodes.map(n => ({
        id: n.id,
        label: n.data.label,
        x: n.position.x,
        y: n.position.y,
        member: n.data.member,
        rotation: n.data.rotation || 0,
      })),
    };

    try {
      const res = await fetch("/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Layout '${layoutName}' saved!`);
        setLayoutName("");
        setFolderName("");
        fetchLayouts();
      } else {
        alert("❌ Failed to save layout");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error saving layout");
    }
  };

  // Load / delete layout
  const loadLayout = (layout: PinyaLayout) => {
    if (!layout.positions) return;
    const loadedNodes: Node[] = layout.positions.map(p => ({
      id: p.id,
      type: "pinya",
      position: { x: p.x, y: p.y },
      data: { label: p.label, member: p.member, rotation: p.rotation || 0 },
    }));
    setNodes(loadedNodes);
  };
  const deleteLayout = async (id: string) => {
    if (!confirm("Delete this layout?")) return;
    try {
      const res = await fetch("/api/layouts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchLayouts();
      else alert("❌ Failed to delete layout");
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting layout");
    }
  };

  // Add role
  const addRole = (role: string) => {
    const id = `${role.toLowerCase()}_${Date.now()}`;
    setNodes(prev => [
      { id, type: "pinya", position: { x: 400, y: Math.max(50, 100 - prev.length * 50) }, data: { label: role, rotation: 0 } },
      ...prev,
    ]);
  };

  const onNodesChange: OnNodesChange = (changes) => setNodes(nds => applyNodeChanges(changes, nds));
  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    key: `${n.id}_${n.data.rotation || 0}`,
    data: {
      ...n.data,
      onAssign: (m: Member) => assignMemberToNode(n.id, m),
      onRemove: () => removeMemberFromNode(n.id),
      onRotate: () => rotateNode(n.id),
    },
  }));

  // Organize attendance by position
  const positionsMap: Record<string, Member[]> = {};
  attendance.forEach(m => {
    const key = m.position || "No role";
    if (!positionsMap[key]) positionsMap[key] = [];
    positionsMap[key].push(m);
  });

  // Folders
  const folders = Array.from(new Set(savedLayouts.map(l => l.folder).filter(Boolean))) as string[];
  const filteredLayouts = selectedFolder
    ? savedLayouts.filter(l => l.folder === selectedFolder)
    : savedLayouts;

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen w-full relative">
        {/* LEFT PANEL */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-2 border-b bg-white sticky top-0 z-10">
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Select date:</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border rounded p-1 w-full text-xs" />
            </div>

            {/* Save Layout */}
            <div className="mb-2">
              <input type="text" placeholder="Layout name" value={layoutName} onChange={e => setLayoutName(e.target.value)} className="border rounded p-1 w-full text-xs mb-1" />
              <input type="text" placeholder="Folder name (optional)" value={folderName} onChange={e => setFolderName(e.target.value)} className="border rounded p-1 w-full text-xs mb-1" />
              <button onClick={saveLayout} className="bg-blue-600 text-white px-2 py-1 rounded w-full text-xs mb-2">💾 Save Layout</button>

              {/* 🧠 Auto Assign Button */}
              <button
                onClick={handleAutoAssign}
                className="bg-green-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-green-700"
              >
                ⚡ Auto Assign
              </button>

              {/* Folder filter */}
              <select value={selectedFolder} onChange={e => setSelectedFolder(e.target.value || undefined)} className="border rounded p-1 w-full text-xs mb-2">
                <option value="">All folders</option>
                {folders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Layout list */}
              <div className="max-h-36 overflow-y-auto">
                {filteredLayouts.map(layout => (
                  <div key={layout.id} className="flex justify-between items-center mb-1 border px-2 py-1 rounded hover:bg-gray-100">
                    <button onClick={() => loadLayout(layout)} className="text-left text-xs flex-1">{layout.name}</button>
                    <button onClick={() => deleteLayout(layout.id)} className="text-red-500 font-bold text-xs ml-2 hover:text-red-700">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
            {Object.keys(positionsMap).map(pos => (
              <div key={pos} className="mb-4">
                <h3 className="font-bold text-sm mb-1">{pos}</h3>
                {positionsMap[pos].map(member => (
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
              const x = (clientEvent as MouseEvent).clientX ?? (clientEvent as TouchEvent).touches?.[0]?.clientX;
              const y = (clientEvent as MouseEvent).clientY ?? (clientEvent as TouchEvent).touches?.[0]?.clientY;
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                setNodes(prev => prev.filter(n => n.id !== node.id));
              }
            }}
          >
            <Background />
            <Controls />
          </ReactFlow>
          <TrashBin />
        </div>

        {/* RIGHT QUICK ROLE PANEL */}
        <div className="fixed top-4 right-4 bg-white rounded-xl shadow-md p-3 flex flex-col gap-2 max-h-[90vh] overflow-auto z-50 w-40">
          <h3 className="font-semibold text-center mb-1 text-sm">Add Role</h3>
          {quickRoles.map(role => (
            <button key={role} onClick={() => addRole(role)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs">+ {role}</button>
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
