// src/app/pinyes-overview/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, { Node, Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import PinyaNode from "@/components/PinyaNode";
import { Quicksand } from "next/font/google";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import { Member } from "@/types/pinya";
import { Menu, X } from "lucide-react";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "600", "700"] });
const nodeTypes = { pinya: PinyaNode };

type LayoutPosition = {
  id: string;
  label: string;
  member?: Member;
  rotation?: number;
  x: number;
  y: number;
};

export type PinyaLayout = {
  id: string;
  name: string;
  positions: LayoutPosition[];
  published_dates?: string[]; // optional, but present in API
};

type LayoutResponse = { layouts: PinyaLayout[] };

export default function PinyesOverviewPage() {
  const router = useRouter();
  const [layouts, setLayouts] = useState<PinyaLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastAngle = useRef<number | null>(null);
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);

  // Fetch ALL published layouts (long-term)
  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const res = await fetch("/api/layouts/published");
        const data = (await res.json()) as LayoutResponse;
        const list = Array.isArray(data.layouts) ? data.layouts : [];
        setLayouts(list);
        if (list.length) setActiveLayoutId(list[0].id);
      } catch (err) {
        console.error("Failed to fetch layouts", err);
        setLayouts([]);
      }
    };
    fetchLayouts();
  }, []);

  // Convert active layout to ReactFlow nodes
  useEffect(() => {
    const activeLayout = layouts.find((l) => l.id === activeLayoutId);
    if (!activeLayout?.positions?.length) {
      setNodes([]);
      return;
    }

    const allNodes: Node[] = activeLayout.positions.map((pos) => {
      const memberName =
        pos.member && typeof pos.member === "object" ? pos.member.nickname ?? "" : "";

      const isHighlighted =
        memberSearch &&
        memberName.toLowerCase().includes(memberSearch.toLowerCase());

      return {
        id: `${activeLayout.id}_${pos.id}`,
        type: "pinya",
        position: { x: pos.x, y: pos.y },
        data: {
          label: pos.label,
          member: pos.member,
          rotation: pos.rotation || 0,
          highlight: isHighlighted,
          showRotateButton: false,
        },
      };
    });

    setNodes(allNodes);
  }, [activeLayoutId, layouts, memberSearch]);

  // Handle pinch rotation & zoom for mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const getCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [t1, t2] = e.touches;
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const distance = getDistance(t1, t2);
        const center = getCenter(t1, t2);

        if (lastAngle.current !== null) {
          const delta = angle - lastAngle.current;
          setRotation((r) => r + delta);
        }

        if (lastDistance.current !== null) {
          const zoom = distance / lastDistance.current;
          setScale((s) => Math.min(3, Math.max(0.3, s * zoom)));
        }

        if (lastCenter.current) {
          const moveX = center.x - lastCenter.current.x;
          const moveY = center.y - lastCenter.current.y;
          setOffset((o) => ({ x: o.x + moveX, y: o.y + moveY }));
        }

        lastAngle.current = angle;
        lastDistance.current = distance;
        lastCenter.current = center;
      }
    };

    const handleTouchEnd = () => {
      lastAngle.current = null;
      lastDistance.current = null;
      lastCenter.current = null;
    };

    el.addEventListener("touchmove", handleTouchMove);
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Desktop zoom & drag
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDragging = false;
    let start = { x: 0, y: 0 };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(3, Math.max(0.3, s * delta)));
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      start = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [offset]);

  return (
    <main
      className={`${quicksand.className} w-full h-screen bg-white dark:bg-gray-900 flex flex-col`}
    >
      {/* Top Bar (collapsible on mobile) */}
      <div className="relative z-20 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-between items-center p-1 md:p-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-800 dark:text-gray-200"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-semibold text-lg md:text-xl mx-auto md:mx-0">
            Pinya Overview
          </h1>
        </div>

        {/* Collapsible menu */}
        <div
          className={`flex flex-col md:flex-row md:items-center md:gap-3 transition-all duration-300 overflow-hidden ${
            menuOpen ? "max-h-96 p-3" : "max-h-0 md:max-h-none md:p-3"
          }`}
        >
          <button
            onClick={() => router.push("/")}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 mb-2 md:mb-0"
          >
            ← Main Page
          </button>

          <input
            type="text"
            placeholder="Search your name..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="border rounded px-4 py-2 flex-1 text-base mb-2 md:mb-0"
          />

          {layouts.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  className={`px-4 py-2 rounded font-semibold whitespace-nowrap text-base transition ${
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
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative touch-none"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
          transition: "transform 0.05s linear",
        }}
      >
        {nodes.length === 0 ? (
          <p className="p-4 text-gray-500">No layouts published.</p>
        ) : (
          <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </DndProvider>
        )}
      </div>
    </main>
  );
}
