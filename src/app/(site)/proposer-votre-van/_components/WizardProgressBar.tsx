"use client";

const STEPS = [
  { label: "Vous", icon: "👤" },
  { label: "Votre van", icon: "🚐" },
  { label: "Photos", icon: "📸" },
  { label: "Tarif", icon: "💰" },
];

interface Props {
  currentStep: number;
}

export default function WizardProgressBar({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;

        return (
          <div key={step.label} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div
                className={`absolute top-5 -left-1/2 w-full h-0.5 transition-colors duration-300 ${
                  isDone ? "bg-blue-500" : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isDone
                  ? "bg-blue-500 text-white"
                  : isActive
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? "✓" : step.icon}
            </div>
            <span
              className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                isActive ? "text-blue-600" : isDone ? "text-blue-500" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
