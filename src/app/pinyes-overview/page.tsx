"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, { Node, Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import PinyaNode from "@/components/PinyaNode";
import { Quicksand } from "next/font/google";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400","600","700"] });
const nodeTypes = { pinya: PinyaNode };

type LayoutPosition = {
  id: string;
  label: string;
  member?: string;
  rotation?: number;
  x: number;
  y: number;
};

export type PinyaLayout = {
  id: string;
  name: string;
  positions: LayoutPosition[];
};

type LayoutResponse = { layouts: PinyaLayout[] };

export default function PinyesOverviewPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [layouts, setLayouts] = useState<PinyaLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);

  // Fetch published layouts for the selected date
  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const res = await fetch(`/api/layouts/published?date=${selectedDate}`);
        const data = (await res.json()) as LayoutResponse;

        setLayouts(Array.isArray(data.layouts) ? data.layouts : []);

        if (Array.isArray(data.layouts) && data.layouts.length > 0) {
          setActiveLayoutId(data.layouts[0].id);
        } else {
          setActiveLayoutId(null);
        }
      } catch (err) {
        console.error("Failed to fetch published layouts", err);
        setLayouts([]);
        setActiveLayoutId(null);
      }
    };

    fetchLayouts();
  }, [selectedDate]);

  // Convert active layout to ReactFlow nodes
  useEffect(() => {
    const activeLayout = layouts.find((l) => l.id === activeLayoutId);

    if (!activeLayout?.positions?.length) {
      setNodes([]);
      return;
    }

    const allNodes: Node[] = activeLayout.positions.map((pos) => ({
      id: `${activeLayout.id}_${pos.id}`,
      type: "pinya",
      position: { x: pos.x, y: pos.y },
      data: { label: pos.label, member: pos.member, rotation: pos.rotation || 0 },
    }));

    setNodes(allNodes);
  }, [activeLayoutId, layouts]);

  return (
    <main className={`${quicksand.className} p-6 min-h-screen bg-white dark:bg-gray-900`}>
      <h1 className="text-3xl font-bold text-[#2f2484] dark:text-yellow-400 mb-6">
        Pinyes Overview
      </h1>

      {/* Date selector */}
      <div className="mb-4 flex items-center gap-2">
        <label className="font-semibold">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-1"
        />
      </div>

      {/* Layout selector */}
      {layouts.length > 1 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              className={`px-3 py-1 rounded font-semibold transition ${
                activeLayoutId === layout.id
                  ? "bg-[#2f2484] text-yellow-400"
                  : "bg-gray-200 text-gray-700 hover:bg-[#2f2484] hover:text-yellow-400"
              }`}
              onClick={() => setActiveLayoutId(layout.id)}
            >
              {layout.name}
            </button>
          ))}
        </div>
      )}

      {/* ReactFlow diagram */}
      {nodes.length === 0 ? (
        <p>No layouts published for this date.</p>
      ) : (
        <div className="border h-[70vh]">
          <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
            <ReactFlow nodes={nodes} nodeTypes={nodeTypes} fitView>
              <Background />
              <Controls />
            </ReactFlow>
          </DndProvider>
        </div>
      )}

      {/* Button to go to Check-In */}
      <div className="mt-4">
        <button
          onClick={() => router.push("/check-in")}
          className="bg-[#2f2484] text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-[#2f2484] transition"
        >
          Go to Check-In
        </button>
      </div>
    </main>
  );
}
