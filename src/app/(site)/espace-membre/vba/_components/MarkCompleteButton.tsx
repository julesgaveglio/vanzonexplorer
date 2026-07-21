"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle } from "lucide-react";
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
  const [pulse, setPulse] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    const next = !completed;

    // Mise à jour optimiste : l'animation part instantanément au clic ("paf").
    setCompleted(next);
    if (next) {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }

    setLoading(true);
    try {
      if (next) await markLessonComplete(lessonId);
      else await markLessonIncomplete(lessonId);
    } catch {
      setCompleted(!next); // revert en cas d'échec réseau
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      whileTap={{ scale: 0.94 }}
      className={`relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-sm font-semibold transition-colors duration-300 flex-shrink-0 ${
        completed
          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
      }`}
    >
      {/* Onde verte qui se diffuse une fois à la validation */}
      <AnimatePresence>
        {pulse && (
          <motion.span
            className="absolute inset-0 rounded-xl bg-emerald-400"
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 1.28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <span className="relative flex items-center gap-2">
        <span className="relative w-4 h-4">
          <AnimatePresence mode="wait" initial={false}>
            {completed ? (
              <motion.span
                key="check"
                className="absolute inset-0"
                initial={{ scale: 0, rotate: -35 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 14 }}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span
                key="circle"
                className="absolute inset-0"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Circle className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {completed ? "Terminé" : "Marquer comme terminé"}
      </span>
    </motion.button>
  );
}
