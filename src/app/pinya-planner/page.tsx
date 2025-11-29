// src\app\pinya-planner\page.tsx
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
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<PinyaLayout[]>([]);
  const [layoutName, setLayoutName] = useState("");
  const [selectedSaveFolder, setSelectedSaveFolder] = useState<string>(""); // folder to save in
  const [newFolderName, setNewFolderName] = useState(""); // create new folder
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined); // filter
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [addRoleOpen, setAddRoleOpen] = useState(true);
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [currentLayout, setCurrentLayout] = useState<PinyaLayout | null>(null);
  const [openSession, setOpenSession] = useState(true);
  const [openLayouts, setOpenLayouts] = useState(true);
  const [openMembers, setOpenMembers] = useState(true);

  // --- RSVP-related state ---
  const [votes, setVotes] = useState<{ nickname: string; eventId: string; vote: string }[]>([]);
  const [rsvpMembers, setRsvpMembers] = useState<Member[]>([]);
  type MemberSource = "all" | "checkedin" | "rsvp";
  const [memberSource, setMemberSource] = useState<MemberSource>("checkedin");
  const [rsvpDate, setRsvpDate] = useState<string>(new Date().toISOString().split("T")[0]);


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

  // --- Load members ---
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

  // --- Load attendance ---
  useEffect(() => {
    if (!selectedDate || members.length === 0) {
      setAttendance([]);
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

  // --- Load all votes ---
  useEffect(() => {
    const loadVotes = async () => {
      try {
        const res = await fetch("/api/votes/attendance");
        const json = await res.json();
        setVotes(json.records || []);
      } catch (err) {
        console.error("Failed to load votes:", err);
      }
    };
    loadVotes();
  }, []);

  // --- Compute RSVP “coming” members ---
useEffect(() => {
  if (!rsvpDate || members.length === 0 || votes.length === 0) {
    setRsvpMembers([]);
    return;
  }

  const fetchRehearsalEvent = async () => {
    try {
      const res = await fetch("/api/events");
      const allEvents = await res.json();
      const rehearsal = allEvents.find(
        (e: any) =>
          e.folder === "Rehearsals" &&
          e.date?.slice(0, 10) === rsvpDate
      );
      if (!rehearsal) {
        setRsvpMembers([]);
        return;
      }

      const coming = votes
        .filter(v => v.eventId === rehearsal.id && v.vote === "coming")
        .map(v => members.find(m => m.nickname === v.nickname))
        .filter((m): m is Member => !!m);

      setRsvpMembers(coming);
    } catch (err) {
      console.error("Failed to find rehearsal event:", err);
      setRsvpMembers([]);
    }
  };

  fetchRehearsalEvent();
}, [rsvpDate, members, votes]);


  // --- Assign / remove / rotate nodes ---
  const assignMemberToNode = (nodeId: string, member: Member) => {
    setNodes(prev =>
      prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, member } } : n)
    );

    if (!showAllMembers) {
      setAttendance(prev => prev.filter(m => m.nickname !== member.nickname));
    }
  };

  const removeMemberFromNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.data?.member) return;

    setNodes(prev =>
      prev.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, member: undefined } } : n
      )
    );
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
    const available = [...listSource];
    const updated = nodes.map(n => {
      if (n.data?.member) return n;

      let matchIndex = available.findIndex(
        m => m.position?.toLowerCase() === n.data.label?.toLowerCase()
      );
      if (matchIndex === -1) {
        matchIndex = available.findIndex(
          m => m.position2?.toLowerCase() === n.data.label?.toLowerCase()
        );
      }

      if (matchIndex !== -1) {
        const matched = available[matchIndex];
        available.splice(matchIndex, 1);
        return { ...n, data: { ...n.data, member: matched } };
      }

      return n;
    });

    setNodes(updated);

    if (!showAllMembers) {
      setAttendance(prev =>
        prev.filter(m => {
          const isAssigned = updated.some(n => n.data?.member?.nickname === m.nickname);
          const isAssignedToBaix = updated.some(
            n => n.data?.label === "Baix" && n.data?.member?.nickname === m.nickname
          );
          return !isAssigned || isAssignedToBaix;
        })
      );
    }
  };

  // --- Save layout ---
  const saveLayout = async () => {
  if (!layoutName.trim()) return alert("Please name your layout!");

  // use new folder name if given, otherwise selected existing folder
  const folderToSave = newFolderName.trim() || selectedSaveFolder || undefined;

  const layout: PinyaLayout = {
    id: Date.now().toString(),
    name: layoutName,
    folder: folderToSave,
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
      alert(`✅ Layout '${layoutName}' ${data.message}`);
      setLayoutName("");
      setSelectedSaveFolder("");
      setNewFolderName("");
      fetchLayouts();
    } else {
      alert("❌ Failed to save layout");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error saving layout");
  }
};


  // --- Load / update / delete layout ---
  const loadLayout = (layout: PinyaLayout) => {
    if (!layout.positions) return;
    const loadedNodes: Node[] = layout.positions.map(p => ({
      id: p.id,
      type: "pinya",
      position: { x: p.x, y: p.y },
      data: {
        label: p.label,
        member: p.member,
        rotation: p.rotation ?? 0,
        showRotateButton: true,
      },
    }));

    setNodes(loadedNodes);
    setCurrentLayout(layout);
    if (isMobile) setLeftDrawerOpen(false);
  };

  const updateLayout = async () => {
    if (!currentLayout) return alert("No layout loaded!");

    const updatedLayout: PinyaLayout = {
      ...currentLayout,
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLayout),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Layout '${currentLayout.name}' updated!`);
        fetchLayouts();
      } else {
        alert("❌ Failed to update layout");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error updating layout");
    }
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

  // --- Add role ---
  const addRole = (role: string) => {
    const id = `${role.toLowerCase()}_${Date.now()}`;
    setNodes(prev => [
      {
        id,
        type: "pinya",
        position: { x: 400, y: Math.max(50, 100 - prev.length * 50) },
        data: { label: role, rotation: 0, showRotateButton: true },
      },
      ...prev,
    ]);
  };

  // --- ReactFlow handlers ---
  const onNodesChange: OnNodesChange = (changes: NodeChange[]) =>
    setNodes(nds => applyNodeChanges(changes, nds));

  const nodesWithHandlers = useMemo(() => {
    return nodes.map(n => {
      const member = n.data?.member;
      const isCheckedIn = !!member && attendance.some(a => a.nickname === member.nickname);
      const isRsvpComing = !!member && rsvpMembers.some(a => a.nickname === member.nickname);

      return {
        ...n,
        key: n.id,
        data: {
          ...(n.data ?? {}),
          onAssign: (m: Member) => assignMemberToNode(n.id, m),
          onRemove: () => removeMemberFromNode(n.id),
          onRotate: () => rotateNode(n.id),
          checkedIn: isCheckedIn,
          rsvpComing: isRsvpComing,
          showRotateButton: n.data?.showRotateButton ?? true,
        },
      };
    });
  }, [nodes, attendance, rsvpMembers]);

  // --- Member list source ---
  const listSource =
    memberSource === "all"
      ? members
      : memberSource === "checkedin"
      ? attendance
      : rsvpMembers;

  const assignedNicknames = nodes
    .map(n => n.data?.member?.nickname)
    .filter(Boolean) as string[];

  const visibleMembers = listSource.filter(m => {
    const isAssigned = assignedNicknames.includes(m.nickname);
    const isAssignedToBaix = nodes.some(
      n => n.data?.label?.toLowerCase().includes("baix") &&
           n.data?.member?.nickname === m.nickname
    );
    return !isAssigned || isAssignedToBaix;
  });

  const filteredMembers = visibleMembers.filter(m => {
    const search = memberSearch.toLowerCase();
    return (
      m.nickname.toLowerCase().includes(search) ||
      (m.name?.toLowerCase().includes(search) ?? false) ||
      (m.surname?.toLowerCase().includes(search) ?? false)
    );
  });

  const positionsMap: Record<string, Member[]> = {};
  filteredMembers.forEach(m => {
    const key = m.position ?? "No role";
    if (!positionsMap[key]) positionsMap[key] = [];
    positionsMap[key].push(m);
  });

  const folders = Array.from(new Set(savedLayouts.map(l => l.folder).filter(Boolean))) as string[];
  const filteredLayouts = selectedFolder
    ? savedLayouts.filter(l => l.folder === selectedFolder)
    : savedLayouts;

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

  // --- Layout ---
  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen w-full relative bg-white">
{/* --- LEFT PANEL (desktop) – Layouts + Roles --- */}
<div className="hidden md:flex md:w-72 border-r bg-gray-50">
  <div className="flex-1 flex flex-col overflow-y-auto">

    {/* LAYOUTS SECTION */}
    <div className="border-b bg-white">
      <button
        onClick={() => setOpenLayouts((s) => !s)}
        className="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-[#2f2484] hover:bg-yellow-50"
      >
        <span>Layouts</span>
        <span>{openLayouts ? "−" : "+"}</span>
      </button>

      {openLayouts && (
        <div className="px-4 pb-4 space-y-4">
          {/* Save layout */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block text-gray-600">
              Layout name
            </label>
            <input
              type="text"
              placeholder="e.g. 4d7 – full pinya"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="border rounded px-2 py-1 w-full text-xs bg-gray-50 focus:ring-2 focus:ring-yellow-400"
            />

            <div className="space-y-1 mt-2">
              <label className="text-xs font-semibold block text-gray-600">
                Save in folder
              </label>
              <select
                value={selectedSaveFolder}
                onChange={(e) => setSelectedSaveFolder(e.target.value)}
                className="border rounded px-2 py-1 text-xs w-full bg-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or create new folder..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border rounded px-2 py-1 w-full text-xs bg-gray-50 focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-[10px] text-gray-500">
                If you type a new folder name, the layout will be saved there.
              </p>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <button
                onClick={saveLayout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs w-full"
              >
                💾 Save Layout
              </button>
              {currentLayout && (
                <button
                  onClick={updateLayout}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs w-full"
                >
                  🔄 Update Layout
                </button>
              )}
              <button
                onClick={handleAutoAssign}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs w-full"
              >
                ⚡ Auto Assign
              </button>
            </div>
          </div>

          {/* Filter + list */}
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Filter by folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) =>
                  setSelectedFolder(e.target.value || undefined)
                }
                className="border rounded px-2 py-1 text-xs w-full bg-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">All folders</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-40 overflow-y-auto border rounded bg-gray-50 divide-y divide-gray-200">
              {filteredLayouts.length === 0 && !loadingLayouts && (
                <p className="text-xs text-gray-500 p-2">No saved layouts</p>
              )}
              {filteredLayouts.map((layout) => (
                <div
                  key={layout.id}
                  className="flex justify-between items-center px-2 py-1 hover:bg-yellow-50"
                >
                  <button
                    onClick={() => loadLayout(layout)}
                    className="text-xs text-left flex-1 text-[#2f2484] hover:underline"
                  >
                    {layout.name}
                  </button>
                  <button
                    onClick={() => deleteLayout(layout.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-xs ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              {loadingLayouts && (
                <div className="text-xs text-gray-500 p-2">Loading...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ROLES SECTION */}
    <div className="flex-1 bg-gray-50">
      <button
        onClick={() => setAddRoleOpen((s) => !s)}
        className="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-[#2f2484] hover:bg-yellow-50"
      >
        <span>Roles</span>
        <span>{addRoleOpen ? "−" : "+"}</span>
      </button>

      {addRoleOpen && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickRoles.map((role) => (
              <button
                key={role}
                onClick={() => addRole(role)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs"
              >
                + {role}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</div>



        {/* --- MAIN CANVAS --- */}
        <div className="flex-1 border relative">
          <div className="md:hidden flex items-center justify-between px-3 py-2 border-b bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftDrawerOpen(true)}
                className="p-2 rounded border text-sm"
              >
                ☰
              </button>
              <div className="text-sm font-semibold">Pinya Planner</div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={memberSource}
                onChange={e => setMemberSource(e.target.value as MemberSource)}
                className="border rounded p-1 text-xs"
              >
                <option value="all">👥 All</option>
                <option value="checkedin">✅ Checked-in</option>
                <option value="rsvp">🗳️ RSVP Coming</option>
              </select>
              <button
                onClick={() => setAddRoleOpen(prev => !prev)}
                className="p-2 rounded border text-xs"
              >
                {addRoleOpen ? "− Roles" : "+ Roles"}
              </button>
            </div>
          </div>

          <div className="reactflow-wrapper h-full w-full">
            <ReactFlow
              nodes={nodesWithHandlers}
              onNodesChange={onNodesChange}
              nodeTypes={nodeTypes}
              fitView
              onNodeDragStop={(event, node) => {
                const trash = document.getElementById("trash-bin");
                if (!trash) return;
                const rect = trash.getBoundingClientRect();
                let x: number, y: number;
                const ev: any = event as any;
                if (ev.clientX !== undefined && ev.clientY !== undefined) {
                  x = ev.clientX;
                  y = ev.clientY;
                } else if (ev.touches && ev.touches[0]) {
                  x = ev.touches[0].clientX;
                  y = ev.touches[0].clientY;
                } else return;
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
        {/* --- RIGHT PANEL (desktop) – Session + Members --- */}
<div className="hidden md:flex md:w-72 border-l bg-gray-50">
  <div className="flex-1 flex flex-col overflow-y-auto">

    {/* SESSION SETTINGS */}
    <div className="border-b bg-white">
      <button
        onClick={() => setOpenSession((s) => !s)}
        className="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-[#2f2484] hover:bg-yellow-50"
      >
        <span>Session settings</span>
        <span>{openSession ? "−" : "+"}</span>
      </button>

      {openSession && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold block text-gray-600 mb-1">
              Attendance date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-2 py-1 w-full text-xs bg-gray-50 focus:ring-2 focus:ring-yellow-400"
              max={todayIso}
            />
          </div>

          {memberSource === "rsvp" && (
            <div>
              <label className="text-xs font-semibold block text-gray-600 mb-1">
                RSVP date
              </label>
              <input
                type="date"
                value={rsvpDate}
                onChange={(e) => setRsvpDate(e.target.value)}
                className="border rounded px-2 py-1 w-full text-xs bg-gray-50 focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Show members
            </label>
            <select
              value={memberSource}
              onChange={(e) =>
                setMemberSource(e.target.value as MemberSource)
              }
              className="border rounded px-2 py-1 text-xs w-full bg-white focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All members</option>
              <option value="checkedin">Checked-in</option>
              <option value="rsvp">RSVP coming</option>
            </select>
          </div>
        </div>
      )}
    </div>

    {/* MEMBERS */}
    <div className="flex-1 bg-gray-50">
      <button
        onClick={() => setOpenMembers((s) => !s)}
        className="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-[#2f2484] hover:bg-yellow-50"
      >
        <span>Members</span>
        <span>{openMembers ? "−" : "+"}</span>
      </button>

      {openMembers && (
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="border rounded px-2 py-1 w-full text-xs mb-3 bg-white focus:ring-2 focus:ring-yellow-400"
          />

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-18rem)] pr-1">
            {Object.keys(positionsMap).length === 0 ? (
              <div className="text-xs text-gray-500">No members to show</div>
            ) : (
              Object.keys(positionsMap).map((pos) => (
                <div key={pos}>
                  <h3 className="font-semibold text-xs text-gray-600 mb-1 border-b border-gray-200">
                    {pos}
                  </h3>
                  <div className="space-y-0.5">
                    {positionsMap[pos].map((member, i) => (
                      <AttendanceMember
                        key={`${member.nickname}-${pos}-${i}`}
                        member={member}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  </div>
</div>

        {/* --- Floating Roles panel --- */}
        <div
  className={`fixed right-4 top-24 z-50 flex flex-col items-end transition-all md:hidden ${
    addRoleOpen ? "" : "gap-0"
  }`}
>
          <button
            onClick={() => setAddRoleOpen(prev => !prev)}
            className="bg-gray-800 text-white px-3 py-2 rounded-full shadow-lg mb-2"
          >
            {addRoleOpen ? "− Roles" : "+ Roles"}
          </button>

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

        {/* --- BOTTOM DRAWER (mobile) --- */}
        <div
          className={`fixed left-0 right-0 z-40 md:hidden transition-transform duration-300
            ${leftDrawerOpen ? "translate-y-0" : "translate-y-full"} bottom-0`}
        >
          <div className="bg-white border-t rounded-t-xl shadow-xl max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
              <div className="font-semibold">Menu</div>
              <div className="flex items-center gap-2">
                <select
                  value={memberSource}
                  onChange={e => setMemberSource(e.target.value as MemberSource)}
                  className="border rounded p-1 text-xs"
                >
                  <option value="all">👥 All</option>
                  <option value="checkedin">✅ Checked-in</option>
                  <option value="rsvp">🗳️ RSVP Coming</option>
                </select>
                <button onClick={() => setLeftDrawerOpen(false)} className="px-2 py-1 text-sm">Close</button>
              </div>
            </div>

            <div className="p-3">
             <div className="mb-3">
  <label className="text-xs font-semibold mb-1 block">Layout name</label>
  <input
    type="text"
    placeholder="e.g. 4d7 – full pinya"
    value={layoutName}
    onChange={e => setLayoutName(e.target.value)}
    className="border rounded p-1 w-full text-xs mb-2"
  />

  <label className="text-xs font-semibold mb-1 block">Save in folder</label>
  <select
    value={selectedSaveFolder}
    onChange={e => setSelectedSaveFolder(e.target.value)}
    className="border rounded p-1 w-full text-xs mb-1"
  >
    <option value="">No folder</option>
    {folders.map(f => (
      <option key={f} value={f}>
        {f}
      </option>
    ))}
  </select>
  <input
    type="text"
    placeholder="Or new folder name..."
    value={newFolderName}
    onChange={e => setNewFolderName(e.target.value)}
    className="border rounded p-1 w-full text-xs mb-2"
  />

  <button
    onClick={saveLayout}
    className="bg-blue-600 text-white px-2 py-1 rounded w-full text-xs mb-2"
  >
    💾 Save Layout
  </button>
  {currentLayout && (
    <button
      onClick={updateLayout}
      className="bg-yellow-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-yellow-700"
    >
      🔄 Update Layout
    </button>
  )}
  <button
    onClick={handleAutoAssign}
    className="bg-green-600 text-white px-2 py-1 rounded w-full text-xs mb-2 hover:bg-green-700"
  >
    ⚡ Auto Assign
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
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="border rounded p-1 text-xs w-full"
                    />
                  </div>

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
