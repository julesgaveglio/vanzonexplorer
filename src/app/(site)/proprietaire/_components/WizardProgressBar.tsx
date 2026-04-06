"use client";

/* ─── Step Icons — Vanzon blue (#4D5FEC) ─────────────────────────────── */

function IconUser({ active, done }: { active: boolean; done: boolean }) {
  if (done) return <CheckIcon />;
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#4D5FEC]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconVan({ active, done }: { active: boolean; done: boolean }) {
  if (done) return <CheckIcon />;
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#4D5FEC]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h4.875c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125zm0 0h11.25c.621 0 1.125-.504 1.125-1.125v-3.75c0-.621-.504-1.125-1.125-1.125H13.5l-1.5-3h-2.25" />
    </svg>
  );
}

function IconCamera({ active, done }: { active: boolean; done: boolean }) {
  if (done) return <CheckIcon />;
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#4D5FEC]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function IconTag({ active, done }: { active: boolean; done: boolean }) {
  if (done) return <CheckIcon />;
  return (
    <svg className={`w-5 h-5 ${active ? "text-[#4D5FEC]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ─── Steps config ───────────────────────────────────────────────────── */

const STEPS = [
  { label: "Vous", Icon: IconUser },
  { label: "Votre van", Icon: IconVan },
  { label: "Photos", Icon: IconCamera },
  { label: "Tarif", Icon: IconTag },
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
                  isDone ? "bg-[#4D5FEC]" : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDone
                  ? "bg-[#4D5FEC] text-white"
                  : isActive
                    ? "bg-blue-50 ring-2 ring-[#4D5FEC]"
                    : "bg-slate-100"
              }`}
            >
              <step.Icon active={isActive} done={isDone} />
            </div>
            <span
              className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                isActive ? "text-[#4D5FEC]" : isDone ? "text-[#4D5FEC]" : "text-slate-400"
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
