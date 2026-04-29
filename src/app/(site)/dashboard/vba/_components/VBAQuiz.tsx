"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Indices of correct answers (0-based) */
  correct: number[];
}

interface VBAQuizProps {
  questions: QuizQuestion[];
}

export default function VBAQuiz({ questions }: VBAQuizProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[current];
  const isMultiple = q.correct.length > 1;

  function toggle(idx: number) {
    if (submitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setSelected([idx]);
    }
  }

  function submit() {
    if (selected.length === 0) return;
    setSubmitted(true);
    const isCorrect =
      selected.length === q.correct.length &&
      selected.every((s) => q.correct.includes(s));
    if (isCorrect) setScore((s) => s + 1);
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected([]);
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  }

  function restart() {
    setCurrent(0);
    setSelected([]);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="w-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-8 text-center">
        <Trophy
          className={`w-16 h-16 mx-auto mb-4 ${passed ? "text-yellow-500" : "text-slate-400"}`}
        />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {passed ? "Bravo !" : "Continue tes efforts !"}
        </h2>
        <p className="text-lg text-slate-600 mb-1">
          {score} / {questions.length} bonnes réponses
        </p>
        <p
          className={`text-3xl font-bold mb-6 ${passed ? "text-green-600" : "text-orange-500"}`}
        >
          {pct}%
        </p>
        <button
          onClick={restart}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%`, background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Question {current + 1} / {questions.length}
          </span>
          {isMultiple && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              Plusieurs réponses possibles
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-slate-900 mb-5">
          {q.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {q.options.map((opt, i) => {
            const isSelected = selected.includes(i);
            const isCorrect = q.correct.includes(i);
            let cls =
              "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ";

            if (submitted) {
              if (isCorrect) {
                cls += "border-green-300 bg-green-50 text-green-800";
              } else if (isSelected && !isCorrect) {
                cls += "border-red-300 bg-red-50 text-red-800";
              } else {
                cls += "border-slate-200 bg-slate-50 text-slate-400";
              }
            } else if (isSelected) {
              cls += "border-[#B9945F] text-white ";
              // gold gradient applied via inline style below
            } else {
              cls +=
                "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
            }

            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={cls}
                style={!submitted && isSelected ? { background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                  {submitted && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />
                  )}
                  {submitted && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 ml-auto text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          {!submitted ? (
            <button
              onClick={submit}
              disabled={selected.length === 0}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Valider
            </button>
          ) : (
            <button
              onClick={next}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {current < questions.length - 1 ? "Suivant →" : "Voir le score"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
