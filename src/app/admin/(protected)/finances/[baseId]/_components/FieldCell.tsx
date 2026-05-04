"use client";

import { useState, useRef, useEffect } from "react";
import type { Field } from "./SpreadsheetBase";

interface Props {
  field: Field;
  value: unknown;
  editing: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export default function FieldCell({ field, value, editing, onChange, onBlur }: Props) {
  switch (field.field_type) {
    case "text":
      return <TextCell value={value as string} editing={editing} onChange={onChange} onBlur={onBlur} />;
    case "number":
      return <NumberCell value={value as number} editing={editing} onChange={onChange} onBlur={onBlur} />;
    case "url":
      return <UrlCell value={value as string} editing={editing} onChange={onChange} onBlur={onBlur} />;
    case "checkbox":
      return <CheckboxCell value={value as boolean} onChange={onChange} />;
    case "select":
      return <SelectCell field={field} value={value as string} editing={editing} onChange={onChange} onBlur={onBlur} />;
    case "image":
      return <ImageCell value={value as string} editing={editing} onChange={onChange} onBlur={onBlur} />;
    case "longtext":
      return <LongTextCell value={value as string} editing={editing} onChange={onChange} onBlur={onBlur} />;
    default:
      return <span className="text-xs text-slate-400 px-2">{String(value || "")}</span>;
  }
}

// ── Text Cell ────────────────────────────────────────────────────────────────

function TextCell({ value, editing, onChange, onBlur }: { value: string; editing: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  if (!editing) {
    return <span className="block px-2 py-1.5 text-sm text-slate-800 truncate min-h-[32px]">{value || ""}</span>;
  }

  return (
    <input
      ref={ref}
      type="text"
      defaultValue={value || ""}
      onBlur={(e) => { onChange(e.target.value); onBlur(); }}
      onKeyDown={(e) => { if (e.key === "Enter") { onChange((e.target as HTMLInputElement).value); onBlur(); } if (e.key === "Escape") onBlur(); }}
      className="w-full px-2 py-1.5 text-sm bg-transparent outline-none"
    />
  );
}

// ── Number Cell ──────────────────────────────────────────────────────────────

function NumberCell({ value, editing, onChange, onBlur }: { value: number; editing: boolean; onChange: (v: number) => void; onBlur: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  if (!editing) {
    return (
      <span className="block px-2 py-1.5 text-sm text-slate-800 min-h-[32px]">
        {value != null ? `€${Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` : ""}
      </span>
    );
  }

  return (
    <input
      ref={ref}
      type="number"
      step="0.01"
      defaultValue={value ?? ""}
      onBlur={(e) => { onChange(Number(e.target.value) || 0); onBlur(); }}
      onKeyDown={(e) => { if (e.key === "Enter") { onChange(Number((e.target as HTMLInputElement).value) || 0); onBlur(); } if (e.key === "Escape") onBlur(); }}
      className="w-full px-2 py-1.5 text-sm bg-transparent outline-none tabular-nums"
    />
  );
}

// ── URL Cell ─────────────────────────────────────────────────────────────────

function UrlCell({ value, editing, onChange, onBlur }: { value: string; editing: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  if (!editing) {
    if (!value) return <span className="block px-2 py-1.5 min-h-[32px]" />;
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="block px-2 py-1.5 text-sm text-blue-600 hover:text-blue-800 truncate min-h-[32px]"
      >
        {value.replace(/^https?:\/\/(www\.)?/, "").slice(0, 35)}...
      </a>
    );
  }

  return (
    <input
      ref={ref}
      type="url"
      defaultValue={value || ""}
      onBlur={(e) => { onChange(e.target.value); onBlur(); }}
      onKeyDown={(e) => { if (e.key === "Enter") { onChange((e.target as HTMLInputElement).value); onBlur(); } if (e.key === "Escape") onBlur(); }}
      className="w-full px-2 py-1.5 text-sm bg-transparent outline-none text-blue-600"
    />
  );
}

// ── Checkbox Cell ────────────────────────────────────────────────────────────

function CheckboxCell({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center min-h-[32px]">
      <button
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          value ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
        }`}
      >
        {value && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Select Cell ──────────────────────────────────────────────────────────────

const SELECT_COLORS: Record<string, { bg: string; text: string }> = {
  red: { bg: "#fef2f2", text: "#dc2626" },
  orange: { bg: "#fff7ed", text: "#ea580c" },
  yellow: { bg: "#fefce8", text: "#ca8a04" },
  green: { bg: "#f0fdf4", text: "#16a34a" },
  blue: { bg: "#eff6ff", text: "#2563eb" },
  purple: { bg: "#faf5ff", text: "#9333ea" },
  pink: { bg: "#fdf2f8", text: "#db2777" },
  cyan: { bg: "#ecfeff", text: "#0891b2" },
};

function SelectCell({ field, value, editing, onChange, onBlur }: { field: Field; value: string; editing: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [newOption, setNewOption] = useState("");
  const options = (field.options as { choices?: Array<{ value: string; color: string }> })?.choices || [];

  const selected = options.find((o) => o.value === value);
  const colors = selected ? (SELECT_COLORS[selected.color] || SELECT_COLORS.blue) : null;

  if (!editing) {
    if (!value) return <span className="block px-2 py-1.5 min-h-[32px]" />;
    return (
      <span className="block px-2 py-1.5 min-h-[32px]">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors?.bg || "#f1f5f9", color: colors?.text || "#475569" }}
        >
          {value}
        </span>
      </span>
    );
  }

  return (
    <div className="relative px-1 py-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        className="w-full text-left px-2 py-1 text-sm"
      >
        {value ? (
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: colors?.bg || "#f1f5f9", color: colors?.text || "#475569" }}
          >
            {value}
          </span>
        ) : (
          <span className="text-slate-400">Choisir...</span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-50 w-48 py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const c = SELECT_COLORS[opt.color] || SELECT_COLORS.blue;
            return (
              <button
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setShowDropdown(false); onBlur(); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
                  {opt.value}
                </span>
              </button>
            );
          })}
          {/* Add new option */}
          <div className="border-t border-slate-100 mt-1 pt-1 px-2 pb-1">
            <input
              type="text"
              placeholder="Nouvelle option..."
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newOption.trim()) {
                  const colorKeys = Object.keys(SELECT_COLORS);
                  const newColor = colorKeys[options.length % colorKeys.length];
                  const newChoices = [...options, { value: newOption.trim(), color: newColor }];
                  // Update field options
                  await fetch(`/api/admin/spreadsheet/fields/${field.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ options: { choices: newChoices } }),
                  });
                  onChange(newOption.trim());
                  setNewOption("");
                  setShowDropdown(false);
                  onBlur();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image Cell ───────────────────────────────────────────────────────────────

function ImageCell({ value, editing, onChange, onBlur }: { value: string; editing: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
    }
  }, [editing]);

  if (!editing) {
    if (!value) return <span className="block px-2 py-1.5 min-h-[32px]" />;
    return (
      <div className="px-1.5 py-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-8 w-12 object-cover rounded" />
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type="url"
      placeholder="URL image..."
      defaultValue={value || ""}
      onBlur={(e) => { onChange(e.target.value); onBlur(); }}
      onKeyDown={(e) => { if (e.key === "Enter") { onChange((e.target as HTMLInputElement).value); onBlur(); } if (e.key === "Escape") onBlur(); }}
      className="w-full px-2 py-1.5 text-xs bg-transparent outline-none"
    />
  );
}

// ── LongText Cell ────────────────────────────────────────────────────────────

function LongTextCell({ value, editing, onChange, onBlur }: { value: string; editing: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
    }
  }, [editing]);

  if (!editing) {
    return <span className="block px-2 py-1.5 text-sm text-slate-600 truncate min-h-[32px]">{value || ""}</span>;
  }

  return (
    <textarea
      ref={ref}
      defaultValue={value || ""}
      rows={3}
      onBlur={(e) => { onChange(e.target.value); onBlur(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onBlur(); }}
      className="w-full px-2 py-1.5 text-sm bg-transparent outline-none resize-none"
    />
  );
}
