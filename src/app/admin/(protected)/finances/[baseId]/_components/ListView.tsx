"use client";

import { useState, useCallback } from "react";
import type { Field, SpreadsheetRecord } from "./SpreadsheetBase";
import FieldCell from "./FieldCell";

const FIELD_TYPES = [
  { value: "text", label: "Texte", icon: "A" },
  { value: "number", label: "Nombre", icon: "#" },
  { value: "url", label: "Lien", icon: "🔗" },
  { value: "checkbox", label: "Checkbox", icon: "☑️" },
  { value: "select", label: "Select", icon: "🏷️" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "longtext", label: "Texte long", icon: "📝" },
];

interface Props {
  fields: Field[];
  records: SpreadsheetRecord[];
  onAddRecord: (data?: Record<string, unknown>) => void;
  onUpdateRecord: (id: string, data: Record<string, unknown>) => void;
  onDeleteRecord: (id: string) => void;
  onAddField: (field: { name: string; field_key: string; field_type: string; options?: Record<string, unknown> }) => void;
}

export default function ListView({ fields, records, onAddRecord, onUpdateRecord, onDeleteRecord, onAddField }: Props) {
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldKey: string } | null>(null);

  const handleAddField = useCallback(() => {
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    onAddField({ name: newFieldName.trim(), field_key: key, field_type: newFieldType });
    setNewFieldName("");
    setNewFieldType("text");
    setShowFieldMenu(false);
  }, [newFieldName, newFieldType, onAddField]);

  const handleCellChange = useCallback((recordId: string, fieldKey: string, value: unknown) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    onUpdateRecord(recordId, { ...record.data, [fieldKey]: value });
  }, [records, onUpdateRecord]);

  // Total for number fields
  const totals = fields.reduce<globalThis.Record<string, number>>((acc, f) => {
    if (f.field_type === "number") {
      acc[f.field_key] = records.reduce((sum, r) => sum + (Number(r.data[f.field_key]) || 0), 0);
    }
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-white">
        <span className="text-xs text-slate-400">{records.length} enregistrement{records.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/95 backdrop-blur-sm">
              {/* Row number */}
              <th className="w-[50px] px-3 py-2.5 text-left text-xs font-semibold text-slate-400 border-b border-r border-slate-200 bg-slate-50">
                #
              </th>
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 border-b border-r border-slate-200 bg-slate-50 whitespace-nowrap"
                  style={{ minWidth: f.width, width: f.width }}
                >
                  <span className="mr-1.5 text-slate-400">
                    {FIELD_TYPES.find((t) => t.value === f.field_type)?.icon || "A"}
                  </span>
                  {f.name}
                </th>
              ))}
              {/* Add column button */}
              <th className="w-[44px] px-2 py-2.5 border-b border-slate-200 bg-slate-50">
                <button
                  onClick={() => setShowFieldMenu(!showFieldMenu)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  title="Ajouter une colonne"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={record.id} className="group hover:bg-blue-50/30 transition-colors">
                {/* Row number */}
                <td className="px-3 py-1.5 text-xs text-slate-400 border-b border-r border-slate-100 bg-slate-50/50 relative">
                  <span className="group-hover:hidden">{idx + 1}</span>
                  <button
                    onClick={() => {
                      if (window.confirm("Supprimer cette ligne ?")) onDeleteRecord(record.id);
                    }}
                    className="hidden group-hover:flex absolute inset-0 items-center justify-center text-red-400 hover:text-red-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
                {fields.map((f) => (
                  <td
                    key={f.id}
                    className={`px-1.5 py-0.5 border-b border-r border-slate-100 ${
                      editingCell?.recordId === record.id && editingCell?.fieldKey === f.field_key
                        ? "ring-2 ring-blue-500 ring-inset z-10 relative"
                        : ""
                    }`}
                    style={{ minWidth: f.width, width: f.width }}
                    onClick={() => setEditingCell({ recordId: record.id, fieldKey: f.field_key })}
                  >
                    <FieldCell
                      field={f}
                      value={record.data[f.field_key]}
                      editing={editingCell?.recordId === record.id && editingCell?.fieldKey === f.field_key}
                      onChange={(val) => handleCellChange(record.id, f.field_key, val)}
                      onBlur={() => setEditingCell(null)}
                    />
                  </td>
                ))}
                <td className="border-b border-slate-100" />
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          {Object.keys(totals).length > 0 && records.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/80">
                <td className="px-3 py-2 border-t border-slate-200 text-xs text-slate-400 font-medium">Σ</td>
                {fields.map((f) => (
                  <td key={f.id} className="px-3 py-2 border-t border-slate-200 text-xs font-semibold text-slate-600">
                    {f.field_type === "number" && totals[f.field_key] !== undefined
                      ? `€${totals[f.field_key].toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`
                      : ""}
                  </td>
                ))}
                <td className="border-t border-slate-200" />
              </tr>
            </tfoot>
          )}
        </table>

        {/* Add row button */}
        <button
          onClick={() => onAddRecord()}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors border-b border-slate-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter...
        </button>
      </div>

      {/* Add column popover */}
      {showFieldMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowFieldMenu(false)}>
          <div
            className="absolute top-16 right-16 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Nouvelle colonne</h3>
            <input
              type="text"
              placeholder="Nom de la colonne..."
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddField()}
            />
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {FIELD_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewFieldType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    newFieldType === t.value
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddField}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
