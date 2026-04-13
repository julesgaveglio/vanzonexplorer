"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  sent: "bg-green-100 text-green-800 border border-green-200",
  error: "bg-red-100 text-red-800 border border-red-200",
  review: "bg-blue-100 text-blue-800 border border-blue-200",
  published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  sent: "Envoyé",
  error: "Erreur",
  review: "En review",
  published: "Publié",
};

export function RetryStatusBadge({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isError = currentStatus === "error";
  const isPending = currentStatus === "pending" && loading;

  async function handleRetry() {
    if (!isError || loading) return;
    setLoading(true);
    setCurrentStatus("pending");

    try {
      const res = await fetch("/api/admin/road-trips/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setCurrentStatus("sent");
        router.refresh();
      } else {
        const data = await res.json();
        setCurrentStatus("error");
        alert(`Erreur : ${data.error ?? "Échec du renvoi"}`);
      }
    } catch {
      setCurrentStatus("error");
      alert("Erreur réseau, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (isError) {
    return (
      <button
        onClick={handleRetry}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
          hovered
            ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-sm"
            : "bg-red-100 text-red-800 border border-red-200"
        }`}
      >
        {hovered ? "Renvoyer" : "Erreur"}
      </button>
    );
  }

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <svg
          className="animate-spin h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Envoi...
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[currentStatus] ?? "bg-slate-100 text-slate-700"}`}
    >
      {STATUS_LABELS[currentStatus] ?? currentStatus}
    </span>
  );
}
