"use client";

import { useTransition } from "react";
import { updateVanStatus } from "../actions";

const statuses = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reserve" },
  { value: "sold", label: "Vendu" },
  { value: "preparing", label: "En preparation" },
];

const colors: Record<string, string> = {
  available: "#10B981",
  reserved: "#F59E0B",
  sold: "#EF4444",
  preparing: "#3B82F6",
};

export default function VanStatusSelect({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => {
          startTransition(() => updateVanStatus(id, e.target.value));
        }}
        className="appearance-none text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        style={{
          color: colors[status] ?? "#334155",
          background: colors[status] ? `${colors[status]}15` : "#F1F5F9",
        }}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value} style={{ color: "#334155", background: "#fff" }}>
            {isPending ? "..." : s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
