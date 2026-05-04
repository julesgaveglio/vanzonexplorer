"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ListView from "./ListView";
import GalleryView from "./GalleryView";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Field {
  id: string;
  table_id: string;
  name: string;
  field_key: string;
  field_type: "text" | "number" | "url" | "checkbox" | "select" | "image" | "longtext";
  options: globalThis.globalThis.Record<string, unknown>;
  width: number;
  sort_order: number;
}

export interface SpreadsheetRecord {
  id: string;
  table_id: string;
  data: globalThis.globalThis.Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface View {
  id: string;
  table_id: string;
  name: string;
  icon: string;
  view_type: "list" | "gallery";
  filters: Array<{ field_key: string; value: string }>;
  sort_by: string | null;
  sort_dir: string;
  gallery_image_field: string | null;
}

interface SpreadsheetTable {
  id: string;
  base_id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface Base {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TableData {
  fields: Field[];
  records: SpreadsheetRecord[];
  views: View[];
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SpreadsheetBase({
  base,
  initialTables,
  initialTableData,
}: {
  base: Base;
  initialTables: SpreadsheetTable[];
  initialTableData: TableData | null;
}) {
  const [tables, setTables] = useState<SpreadsheetTable[]>(initialTables);
  const [activeTableId, setActiveTableId] = useState<string | null>(initialTables[0]?.id || null);
  const [tableData, setTableData] = useState<TableData | null>(initialTableData);
  const [activeViewId, setActiveViewId] = useState<string | null>(initialTableData?.views?.[0]?.id || null);
  const [loading, setLoading] = useState(false);

  // ── Load table data ────────────────────────────────────────────────────

  const loadTable = useCallback(async (tableId: string) => {
    setLoading(true);
    setActiveTableId(tableId);
    const res = await fetch(`/api/admin/spreadsheet/tables/${tableId}`);
    const json = await res.json();
    setTableData({ fields: json.fields || [], records: json.records || [], views: json.views || [] });
    setActiveViewId(json.views?.[0]?.id || null);
    setLoading(false);

    // Touch base updated_at
    fetch(`/api/admin/spreadsheet/bases/${base.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: base.name }),
    });
  }, [base.id, base.name]);

  // ── Create table ───────────────────────────────────────────────────────

  const handleAddTable = useCallback(async () => {
    const name = window.prompt("Nom de la table :");
    if (!name?.trim()) return;

    const res = await fetch("/api/admin/spreadsheet/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_id: base.id, name: name.trim() }),
    });
    const json = await res.json();
    if (json.table) {
      setTables((prev) => [...prev, json.table]);
      loadTable(json.table.id);
    }
  }, [base.id, loadTable]);

  // ── Add field ──────────────────────────────────────────────────────────

  const handleAddField = useCallback(async (field: { name: string; field_key: string; field_type: string; options?: globalThis.Record<string, unknown> }) => {
    if (!activeTableId) return;
    const res = await fetch("/api/admin/spreadsheet/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: activeTableId, ...field }),
    });
    const json = await res.json();
    if (json.field) {
      setTableData((prev) => prev ? { ...prev, fields: [...prev.fields, json.field] } : prev);
    }
  }, [activeTableId]);

  // ── Add record ─────────────────────────────────────────────────────────

  const handleAddRecord = useCallback(async (data?: globalThis.Record<string, unknown>) => {
    if (!activeTableId) return;
    const res = await fetch("/api/admin/spreadsheet/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: activeTableId, data: data || {} }),
    });
    const json = await res.json();
    if (json.record) {
      setTableData((prev) => prev ? { ...prev, records: [...prev.records, json.record] } : prev);
    }
  }, [activeTableId]);

  // ── Update record ──────────────────────────────────────────────────────

  const handleUpdateRecord = useCallback(async (recordId: string, data: globalThis.Record<string, unknown>) => {
    const res = await fetch(`/api/admin/spreadsheet/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const json = await res.json();
    if (json.record) {
      setTableData((prev) =>
        prev ? { ...prev, records: prev.records.map((r) => (r.id === recordId ? json.record : r)) } : prev
      );
    }
  }, []);

  // ── Delete record ──────────────────────────────────────────────────────

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    const res = await fetch(`/api/admin/spreadsheet/records/${recordId}`, { method: "DELETE" });
    if (res.ok) {
      setTableData((prev) =>
        prev ? { ...prev, records: prev.records.filter((r) => r.id !== recordId) } : prev
      );
    }
  }, []);

  // ── Add view ───────────────────────────────────────────────────────────

  const handleAddView = useCallback(async (view: { name: string; view_type: string; filters?: Array<{ field_key: string; value: string }>; gallery_image_field?: string; icon?: string }) => {
    if (!activeTableId) return;
    const res = await fetch("/api/admin/spreadsheet/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: activeTableId, ...view }),
    });
    const json = await res.json();
    if (json.view) {
      setTableData((prev) => prev ? { ...prev, views: [...prev.views, json.view] } : prev);
      setActiveViewId(json.view.id);
    }
  }, [activeTableId]);

  // ── Current view ───────────────────────────────────────────────────────

  const activeView = tableData?.views?.find((v) => v.id === activeViewId) || null;

  // Apply view filters
  const filteredRecords = tableData?.records?.filter((record) => {
    if (!activeView?.filters?.length) return true;
    return activeView.filters.every((f) => {
      const val = String(record.data[f.field_key] || "");
      return val === f.value;
    });
  }) || [];

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)]">
      {/* Top bar — base name + tabs */}
      <div className="bg-white border-b border-slate-200">
        {/* Base header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <Link href="/admin/finances" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: `${base.color}15`, color: base.color }}
          >
            {base.icon}
          </div>
          <h1 className="text-lg font-bold text-slate-900">{base.name}</h1>
        </div>

        {/* Table tabs */}
        <div className="flex items-center gap-0.5 px-5 overflow-x-auto">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTable(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTableId === t.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {t.icon !== "📋" && <span className="mr-1.5">{t.icon}</span>}
              {t.name}
            </button>
          ))}
          <button
            onClick={handleAddTable}
            className="px-3 py-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="Ajouter une table"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area — sidebar + main */}
      {!activeTableId || !tableData ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${base.color}15` }}>
            <svg className="w-8 h-8" style={{ color: base.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Pas encore de table</h2>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">Cree ta premiere table pour commencer a organiser tes donnees dans cette base.</p>
          <button
            onClick={handleAddTable}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Creer une table
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-10rem)]">
          {/* Sidebar — views */}
          <Sidebar
            views={tableData.views}
            fields={tableData.fields}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onAddView={handleAddView}
          />

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {activeView?.view_type === "gallery" ? (
              <GalleryView
                fields={tableData.fields}
                records={filteredRecords}
                imageField={activeView.gallery_image_field}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
              />
            ) : (
              <ListView
                fields={tableData.fields}
                records={filteredRecords}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onAddField={handleAddField}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  views,
  fields,
  activeViewId,
  onSelectView,
  onAddView,
}: {
  views: View[];
  fields: Field[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onAddView: (view: { name: string; view_type: string; filters?: Array<{ field_key: string; value: string }>; gallery_image_field?: string; icon?: string }) => void;
}) {
  const [showNew, setShowNew] = useState(false);

  // Find select fields for quick filter views
  const selectFields = fields.filter((f) => f.field_type === "select");

  return (
    <div className="w-[220px] bg-slate-50/60 border-r border-slate-200 flex-shrink-0 overflow-y-auto hidden md:block">
      <div className="p-3">
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une vue"
            className="w-full text-xs border-0 bg-white rounded-lg pl-8 pr-3 py-2 text-slate-600 placeholder:text-slate-400 shadow-sm"
            readOnly
          />
        </div>

        {/* Create button */}
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 w-full text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 mb-2"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Creer...
        </button>

        {showNew && (
          <div className="mb-3 p-2 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <button
              onClick={() => { onAddView({ name: "Vue liste", view_type: "list", icon: "📋" }); setShowNew(false); }}
              className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50 text-slate-600"
            >
              📋 Vue liste
            </button>
            <button
              onClick={() => {
                const imgField = fields.find((f) => f.field_type === "image")?.field_key;
                onAddView({ name: "Vue galerie", view_type: "gallery", icon: "🖼️", gallery_image_field: imgField || undefined });
                setShowNew(false);
              }}
              className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50 text-slate-600"
            >
              🖼️ Vue galerie
            </button>
            {/* Quick filter views for each select value */}
            {selectFields.map((sf) => {
              const choices = (sf.options as { choices?: Array<{ value: string }> })?.choices || [];
              return choices.map((choice) => (
                <button
                  key={`${sf.id}-${choice.value}`}
                  onClick={() => {
                    onAddView({
                      name: choice.value,
                      view_type: "list",
                      icon: "🏷️",
                      filters: [{ field_key: sf.field_key, value: choice.value }],
                    });
                    setShowNew(false);
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                >
                  🏷️ {choice.value}
                </button>
              ));
            })}
          </div>
        )}

        {/* Views list */}
        <ul className="space-y-0.5">
          {views.map((v) => (
            <li key={v.id}>
              <button
                onClick={() => onSelectView(v.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeViewId === v.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-800"
                }`}
              >
                <span className="text-sm">{v.icon}</span>
                <span className="truncate">{v.name}</span>
                {v.filters && v.filters.length > 0 && (
                  <span className="ml-auto text-[10px] text-slate-400">{v.filters.length}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
