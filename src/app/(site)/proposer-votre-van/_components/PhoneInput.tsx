"use client";

import { useState, useRef, useEffect } from "react";
import { useFormContext, useController } from "react-hook-form";

const COUNTRIES = [
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "France" },
  { code: "BE", dial: "+32",  flag: "🇧🇪", name: "Belgique" },
  { code: "CH", dial: "+41",  flag: "🇨🇭", name: "Suisse" },
  { code: "LU", dial: "+352", flag: "🇱🇺", name: "Luxembourg" },
  { code: "NL", dial: "+31",  flag: "🇳🇱", name: "Pays-Bas" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Allemagne" },
  { code: "ES", dial: "+34",  flag: "🇪🇸", name: "Espagne" },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Italie" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "AT", dial: "+43",  flag: "🇦🇹", name: "Autriche" },
  { code: "DK", dial: "+45",  flag: "🇩🇰", name: "Danemark" },
  { code: "SE", dial: "+46",  flag: "🇸🇪", name: "Suède" },
  { code: "NO", dial: "+47",  flag: "🇳🇴", name: "Norvège" },
  { code: "MA", dial: "+212", flag: "🇲🇦", name: "Maroc" },
];

const DEFAULT = COUNTRIES[0]; // France +33

function parseExistingValue(val: string) {
  for (const c of COUNTRIES) {
    if (val.startsWith(c.dial)) {
      return { dialCode: c.dial, local: val.slice(c.dial.length).trimStart() };
    }
  }
  return { dialCode: DEFAULT.dial, local: val };
}

interface Props {
  name: string;
}

export default function PhoneInput({ name }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const { field } = useController({ name, control });

  const init = parseExistingValue(field.value || "");
  const [dialCode, setDialCode] = useState(init.dialCode);
  const [local, setLocal]       = useState(init.local);
  const [open, setOpen]         = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.dial === dialCode) ?? DEFAULT;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const syncField = (dial: string, num: string) => {
    field.onChange(`${dial}${num ? " " + num : ""}`);
  };

  const handleDial = (dial: string) => {
    setDialCode(dial);
    setOpen(false);
    syncField(dial, local);
  };

  const handleLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value;
    setLocal(num);
    syncField(dialCode, num);
  };

  const error = errors[name];

  return (
    <div>
      <div className={`flex rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-400/50 focus-within:border-blue-400 ${error ? "border-red-300" : "border-slate-200"}`}>
        {/* Dial code trigger */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="h-full flex items-center gap-1.5 px-3 py-3 bg-white/75 border-r border-slate-200 rounded-l-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="text-lg leading-none">{selected.flag}</span>
            <span className="text-slate-500 text-xs tabular-nums">{selected.dial}</span>
            <svg
              className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-64 overflow-y-auto py-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleDial(c.dial)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                    c.dial === dialCode
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-auto text-slate-400 text-xs tabular-nums">{c.dial}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          type="tel"
          value={local}
          onChange={handleLocal}
          onBlur={field.onBlur}
          placeholder="6 12 34 56 78"
          className="flex-1 min-w-0 bg-white/75 rounded-r-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none text-sm"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error.message as string}</p>
      )}
    </div>
  );
}
