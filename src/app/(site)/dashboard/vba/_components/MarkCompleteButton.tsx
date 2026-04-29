"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { markLessonComplete, markLessonIncomplete } from "../_actions";

export default function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (completed) {
        await markLessonIncomplete(lessonId);
        setCompleted(false);
      } else {
        await markLessonComplete(lessonId);
        setCompleted(true);
      }
    } catch {
      // revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 flex-shrink-0 ${
        completed
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-900 text-white hover:bg-slate-700"
      }`}
    >
      {completed ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Terminé
        </>
      ) : (
        <>
          <Circle className="w-4 h-4" />
          {loading ? "..." : "Marquer comme terminé"}
        </>
      )}
    </button>
  );
}
