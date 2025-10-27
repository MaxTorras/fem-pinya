/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  applyNodeChanges,
  Background,
  Controls,
  OnNodesChange,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import * as htmlToImage from "html-to-image";
import download from "downloadjs";

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
  // --- UI state ---
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Member[]>([]);
  const [showAllMembers, setShowAllMembers] = useState(false); // toggle all vs checked-in
  const [nodes, setNodes] = useState<Node[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<PinyaLayout[]>([]);
  const [layoutName, setLayoutName] = useState("");
  const [folderName, setFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false); // for mobile bottom drawer
  const [addRoleOpen, setAddRoleOpen] = useState(true); // collapsible Add Role panel
  const [loadingLayouts, setLoadingLayouts] = useState(false);

  // --- Fetch layouts ---
  const fetchLayouts = async () => {
    setLoadingLayouts(true);
    try {
      const res = await fetch("/api/layouts");
      const layouts = (await res.json()) as PinyaLayout[];
      setSavedLayouts(layouts || []);
    } catch (err) {
      console.error("Failed to fetch layouts:", err);
    } finally {
      setLoadingLayouts(false);
    }
  };

  useEffect(() => { fetchLayouts(); }, []);

  // --- Load members (all) ---
  useEffect(() => {
    let mounted = true;
    fetch("/api/members")
      .then(res => res.json())
      .then((data: { members: Member[] }) => {
        if (!mounted) return;
        setMembers(data.members || []);
      })
      .catch(err => console.error("Failed to load members:", err));
    return () => { mounted = false; };
  }, []);

  // --- Load attendance for selected date ---
  useEffect(() => {
    if (!selectedDate || members.length === 0) {
      setAttendance([]); // clear while we wait
      return;
    }
    let mounted = true;
    fetch(`/api/attendance?date=${selectedDate}`)
      .then(res => res.json())
      .then((data: { records: AttendanceRecord[] }) => {
        if (!mounted) return;
        const presentMembers = data.records
          .map(r => members.find(m => m.nickname === r.nickname))
          .filter((m): m is Member => !!m);
        setAttendance(presentMembers);
      })
      .catch(err => {
        console.error("Failed to load attendance:", err);
        if (mounted) setAttendance([]);
      });
    return () => { mounted = false; };
  }, [selectedDate, members]);

  // --- Helpers: assign/remove/rotate nodes ---
  const assignMemberToNode = (nodeId: string, member: Member) => {
    setNodes(prev =>
      prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, member } } : n)
    );
    // remove from attendance list (if we are using checked-in list)
    setAttendance(prev => prev.filter(m => m.nickname !== member.nickname));
  };

  const removeMemberFromNode = (nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node?.data?.member) return;

  // Remove from node first
  setNodes(prev =>
    prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, member: undefined } } : n)
  );

  // Add back to attendance (checked-in mode)
  setAttendance(prev => [...prev, node.data.member]);
};

  const rotateNode = (nodeId: string) => {
    setNodes(prev =>
      prev.map(n => n.id === nodeId
        ? { ...n, data: { ...n.data, rotation: ((n.data.rotation ?? 0) + 45) % 360 } }
        : n
      )
    );
  };

  const handleAutoAssign = () => {
  const available = [...listSource]; // use currently visible members
  const updated = nodes.map(n => {
    if (n.data?.member) return n; // already assigned

    // Try primary position first
    let matchIndex = available.findIndex(
      m => m.position?.toLowerCase() === n.data.label?.toLowerCase()
    );

    // If no primary match, try secondary position
    if (matchIndex === -1) {
      matchIndex = available.findIndex(
        m => m.position2?.toLowerCase() === n.data.label?.toLowerCase()
      );
    }

    if (matchIndex !== -1) {
      const matched = available[matchIndex];
      available.splice(matchIndex, 1); // remove from available
      return { ...n, data: { ...n.data, member: matched } };
    }

    return n;
  });

  setNodes(updated);

  // Remove assigned from the visible list only if using checked-in mode
  if (!showAllMembers) {
  setAttendance(prev =>
    prev.filter(m => 
      !updated.some(n => n.data?.member?.nickname === m.nickname) || m.position === "Baix"
    )
  );
}

};



  // --- Save layout ---
  const saveLayout = async () => {
    if (!layoutName.trim()) return alert("Please name your layout!");
    const layout: PinyaLayout = {
      id: Date.now().toString(),
      name: layoutName,
      folder: folderName || undefined,
      castellType: "4d7",
      positions: nodes.map(n => ({
        id: n.id,
        label: n.data?.label ?? "",
        x: n.position?.x ?? 0,
        y: n.position?.y ?? 0,
        member: n.data?.member,
        rotation: n.data?.rotation ?? 0,
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

  // --- Load layout ---
  const loadLayout = (layout: PinyaLayout) => {
    if (!layout.positions) return;
    const loadedNodes: Node[] = layout.positions.map(p => ({
      id: p.id,
      type: "pinya",
      position: { x: p.x, y: p.y },
      data: { label: p.label, member: p.member, rotation: p.rotation ?? 0 },
    }));
    setNodes(loadedNodes);
    // close drawer on mobile for better canvas view
    if (isMobile) setLeftDrawerOpen(false);
  };

  // --- Delete layout ---
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

  // --- Add role ---
  const addRole = (role: string) => {
    const id = `${role.toLowerCase()}_${Date.now()}`;
    setNodes(prev => [
      { id, type: "pinya", position: { x: 400, y: Math.max(50, 100 - prev.length * 50) }, data: { label: role, rotation: 0 } },
      ...prev,
    ]);
  };

  // --- Node handlers & mapping handlers into node data ---
  const onNodesChange: OnNodesChange = (changes: NodeChange[]) =>
    setNodes(nds => applyNodeChanges(changes, nds));

  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    key: `${n.id}_${n.data?.rotation ?? 0}`,
    data: {
      ...(n.data ?? {}),
      onAssign: (m: Member) => assignMemberToNode(n.id, m),
      onRemove: () => removeMemberFromNode(n.id),
      onRotate: () => rotateNode(n.id),
    },
  }));

  // --- Organize members for the left panel ---
// listSource = members (all) or attendance (checked-in)
// Compute left panel members
const listSource = showAllMembers ? members : attendance;


// Compute which members are already assigned to nodes
const assignedNicknames = nodes.map(n => n.data?.member?.nickname).filter(Boolean) as string[];

// Only show members who are not assigned to any node
const visibleMembers = listSource.filter(m => 
  !assignedNicknames.includes(m.nickname) || m.position === "Baix"
);

// Map positions
const positionsMap: Record<string, Member[]> = {};
visibleMembers.forEach(m => {
  const key = m.position ?? "No role";
  if (!positionsMap[key]) positionsMap[key] = [];
  positionsMap[key].push(m);
});

  // --- Folder filtering helpers ---
  const folders = Array.from(new Set(savedLayouts.map(l => l.folder).filter(Boolean))) as string[];
  const filteredLayouts = selectedFolder
    ? savedLayouts.filter(l => l.folder === selectedFolder)
    : savedLayouts;

  // --- Export ReactFlow canvas as image ---
  const exportLayoutAsImage = async () => {
    const canvas = document.querySelector<HTMLDivElement>(".reactflow-wrapper");
    if (!canvas) return alert("Canvas not found!");
    try {
      const dataUrl = await htmlToImage.toPng(canvas, { cacheBust: true });
      download(dataUrl, `pinya-layout-${Date.now()}.png`);
    } catch (err) {
      console.error("Failed to export layout:", err);
      alert("❌ Failed to export layout");
    }
  };

  const todayIso = new Date().toISOString().split("T")[0];

  // --- Layout for desktop / mobile ---
  // On mobile we show a small top bar with buttons: open drawer, toggle showAllMembers, collapse addRole (floating)
  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen w-full relative bg-white">
        {/* --- DESKTOP LEFT PANEL (hidden on small screens) --- */}
        <div className="hidden md:flex md:w-64 border-r flex-col">
          <div className="p-3 border-b sticky top-0 bg-white z-10">
            <div className="mb-2">
              <label className="text-xs font-semibold mb-1 block">Select date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border rounded p-1 w-full text-xs"
                max={todayIso}
              />
            </div>

            <div className="mb-2">
              <input
                type="text"
                placeholder="Layout name"
                value={layoutName}
                onChange={e => setLayoutName(e.target.value)}
                className="border rounded p-1 w-full text-xs mb-1"
              />
              <input
                type="text"
                placeholder="Folder name (optional)"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                className="border rounded p-1 w-full text-xs mb-1"
              />
              <button
                onClick={saveLayout}
                className="bg-blue-600 text-white px-2 py-1 rounded w-full text-xs mb-2"
              >
                💾 Save Layout
              </button>
              <button
                onClick={handleAutoAssign}
                className="bg-green-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-green-700"
              >
                ⚡ Auto Assign
              </button>
              <button
                onClick={exportLayoutAsImage}
                className="bg-purple-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-purple-700"
              >
                📷 Export Layout
              </button>

              <div className="flex gap-2 mb-2">
                <select
                  value={selectedFolder}
                  onChange={e => setSelectedFolder(e.target.value || undefined)}
                  className="border rounded p-1 text-xs flex-1"
                >
                  <option value="">All folders</option>
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button
                  onClick={() => { setShowAllMembers(prev => !prev); }}
                  className="border rounded p-1 text-xs"
                  title="Toggle show all members / checked-in"
                >
                  {showAllMembers ? "👥 All" : "✅ Checked-in"}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto">
                {filteredLayouts.map(layout => (
                  <div key={layout.id} className="flex justify-between items-center mb-1 border px-2 py-1 rounded hover:bg-gray-100">
                    <button onClick={() => loadLayout(layout)} className="text-left text-xs flex-1">{layout.name}</button>
                    <button onClick={() => deleteLayout(layout.id)} className="text-red-500 font-bold text-xs ml-2 hover:text-red-700">×</button>
                  </div>
                ))}
                {loadingLayouts && <div className="text-xs text-gray-500 mt-2">Loading...</div>}
              </div>
            </div>
          </div>

          {/* Members list (desktop) */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {Object.keys(positionsMap).length === 0 ? (
              <div className="text-xs text-gray-500">No members to show</div>
            ) : (
              Object.keys(positionsMap).map(pos => (
                <div key={pos} className="mb-4">
                  <h3 className="font-bold text-sm mb-1">{pos}</h3>
                  {positionsMap[pos].map(member => (
                    <AttendanceMember key={member.nickname} member={member} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- MAIN CANVAS --- */}
        <div className="flex-1 border relative">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-3 py-2 border-b bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftDrawerOpen(true)}
                className="p-2 rounded border text-sm"
                aria-label="Open menu"
              >
                ☰
              </button>
              <div className="text-sm font-semibold">Pinya Planner</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllMembers(prev => !prev)}
                className="p-2 rounded border text-xs"
                title="Toggle show all members / checked-in"
              >
                {showAllMembers ? "👥 All" : "✅ Checked-in"}
              </button>
              <button
                onClick={() => setAddRoleOpen(prev => !prev)}
                className="p-2 rounded border text-xs"
                title="Toggle add role"
              >
                {addRoleOpen ? "− Roles" : "+ Roles"}
              </button>
            </div>
          </div>

          {/* ReactFlow wrapper */}
          <div className="reactflow-wrapper h-full w-full">
            <ReactFlow
              nodes={nodesWithHandlers}
              onNodesChange={onNodesChange}
              nodeTypes={nodeTypes}
              fitView
              onNodeDragStop={(event: React.MouseEvent | React.TouchEvent, node) => {
                const trash = document.getElementById("trash-bin");
                if (!trash) return;
                const rect = trash.getBoundingClientRect();

                let x: number, y: number;
                // handle both mouse and touch events
                const ev: any = event as any;
                if (ev.clientX !== undefined && ev.clientY !== undefined) {
                  x = ev.clientX;
                  y = ev.clientY;
                } else if (ev.touches && ev.touches[0]) {
                  x = ev.touches[0].clientX;
                  y = ev.touches[0].clientY;
                } else {
                  return;
                }

                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                  setNodes(prev => prev.filter(n => n.id !== node.id));
                }
              }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          <TrashBin />
        </div>

        {/* --- COLLAPSIBLE ADD ROLE (floating) --- */}
        <div className={`fixed right-4 top-24 z-50 flex flex-col items-end transition-all ${addRoleOpen ? "" : "gap-0"}`}>
          {/* Toggle */}
          <button
            onClick={() => setAddRoleOpen(prev => !prev)}
            className="bg-gray-800 text-white px-3 py-2 rounded-full shadow-lg mb-2"
            aria-expanded={addRoleOpen}
            title={addRoleOpen ? "Collapse roles" : "Expand roles"}
          >
            {addRoleOpen ? "− Roles" : "+ Roles"}
          </button>

          {/* Buttons list (hidden when collapsed) */}
          {addRoleOpen && (
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-auto p-2 bg-white rounded-xl shadow-lg w-40">
              <h4 className="text-sm font-semibold text-center">Add Role</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => addRole(role)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs w-full"
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- BOTTOM DRAWER (mobile) for left panel --- */}
        <div
          className={`fixed left-0 right-0 z-40 md:hidden transition-transform duration-300
            ${leftDrawerOpen ? "translate-y-0" : "translate-y-full"} bottom-0`}
          aria-hidden={!leftDrawerOpen}
        >
          <div className="bg-white border-t rounded-t-xl shadow-xl max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
              <div className="font-semibold">Menu</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllMembers(prev => !prev)}
                  className="text-xs px-2 py-1 border rounded"
                >
                  {showAllMembers ? "👥 All" : "✅ Checked-in"}
                </button>
                <button onClick={() => setLeftDrawerOpen(false)} className="px-2 py-1 text-sm">Close</button>
              </div>
            </div>

            <div className="p-3">
              <div className="mb-3">
                <label className="text-xs font-semibold mb-1 block">Select date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border rounded p-1 w-full text-xs"
                  max={todayIso}
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Layout name"
                  value={layoutName}
                  onChange={e => setLayoutName(e.target.value)}
                  className="border rounded p-1 w-full text-xs mb-1"
                />
                <input
                  type="text"
                  placeholder="Folder name (optional)"
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  className="border rounded p-1 w-full text-xs mb-1"
                />
                <button
                  onClick={saveLayout}
                  className="bg-blue-600 text-white px-2 py-1 rounded w-full text-xs mb-2"
                >
                  💾 Save Layout
                </button>
                <button
                  onClick={handleAutoAssign}
                  className="bg-green-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-green-700"
                >
                  ⚡ Auto Assign
                </button>
                <button
                  onClick={exportLayoutAsImage}
                  className="bg-purple-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-purple-700"
                >
                  📷 Export Layout
                </button>
              </div>

              <div className="mb-3">
                <select
                  value={selectedFolder}
                  onChange={e => setSelectedFolder(e.target.value || undefined)}
                  className="border rounded p-1 w-full text-xs mb-2"
                >
                  <option value="">All folders</option>
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                <div className="max-h-36 overflow-y-auto mb-3">
                  {filteredLayouts.map(layout => (
                    <div key={layout.id} className="flex justify-between items-center mb-1 border px-2 py-1 rounded hover:bg-gray-100">
                      <button onClick={() => loadLayout(layout)} className="text-left text-xs flex-1">{layout.name}</button>
                      <button onClick={() => deleteLayout(layout.id)} className="text-red-500 font-bold text-xs ml-2 hover:text-red-700">×</button>
                    </div>
                  ))}
                  {loadingLayouts && <div className="text-xs text-gray-500 mt-2">Loading...</div>}
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm">Members</h4>
                  {Object.keys(positionsMap).length === 0 ? (
                    <div className="text-xs text-gray-500">No members to show</div>
                  ) : (
                    Object.keys(positionsMap).map(pos => (
                      <div key={pos} className="mb-3">
                        <h5 className="font-medium text-xs mb-1">{pos}</h5>
                        {positionsMap[pos].map(member => (
                          <AttendanceMember key={member.nickname} member={member} />
                        ))}
                      </div>
                    ))
                  )}  
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DndProvider>
  );
}
