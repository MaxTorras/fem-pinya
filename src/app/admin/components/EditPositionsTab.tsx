// src/app/admin/components/EditPositionsTab.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

type PositionRow = {
  nickname: string;
  name?: string;
  surname?: string;
  position?: string | null;
  position2?: string | null;
};

// 🔽 customise this list however you want
const POSITION_OPTIONS = [
  "",
  "Agulla",
  "Baix",
  "Canalla",
  "Contrafort",
  "Crossa",
  "Lateral",
  "Mans",
  "Vent",
  "Music",
  "New",
  "Segon",
  "Terç",
  "Dosos",
  "Diagonal",
];

export default function EditPositionsTab() {
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/positions");
        if (!res.ok) throw new Error(`Failed to load positions (${res.status})`);
        const data = await res.json();
        setRows(data.positions || []);
      } catch (err: any) {
        console.error("Failed to load positions", err);
        setError(err.message || "Failed to load positions");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (
    index: number,
    field: keyof PositionRow,
    value: string
  ) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value || null };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: rows }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Failed to save positions (${res.status}) - ${body || "No message"}`
        );
      }
      setMessage("Positions updated ✅");
    } catch (err: any) {
      console.error("Failed to save positions", err);
      setError(err.message || "Failed to save positions");
    } finally {
      setSaving(false);
      setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 3000);
    }
  };

  if (loading) return <p>Loading positions…</p>;

  return (
    <div className="space-y-4">
      {/* 🔹 Header + Save button */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#2f2484]">
          Edit Positions
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-[#2f2484] text-yellow-300 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* 🔹 Messages */}
      {message && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-[#2f2484] rounded overflow-hidden">
          <thead className="bg-[#2f2484] text-yellow-300">
            <tr>
              <th className="px-3 py-2 text-left">Nickname</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Surname</th>
              <th className="px-3 py-2 text-left">Position</th>
              <th className="px-3 py-2 text-left">Position 2</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {rows.map((row, index) => (
              <tr key={row.nickname}>
                <td className="px-3 py-2 align-top font-semibold">
                  {row.nickname}
                </td>
                <td className="px-3 py-2 align-top text-gray-700">
                  {row.name}
                </td>
                <td className="px-3 py-2 align-top text-gray-700">
                  {row.surname}
                </td>

                {/* 🔽 Position dropdown */}
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.position || ""}
                    onChange={(e) =>
                      handleChange(index, "position", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "" ? "—" : opt}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 🔽 Secondary position dropdown */}
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.position2 || ""}
                    onChange={(e) =>
                      handleChange(index, "position2", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "" ? "—" : opt}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Changes here update columns <code>Position</code> and{" "}
        <code>Position2</code> in your <strong>Members</strong> sheet.
      </p>
    </div>
  );
}
