"use client";

import type { Field, SpreadsheetRecord } from "./SpreadsheetBase";

interface Props {
  fields: Field[];
  records: SpreadsheetRecord[];
  imageField: string | null;
  onAddRecord: (data?: Record<string, unknown>) => void;
  onUpdateRecord: (id: string, data: Record<string, unknown>) => void;
}

export default function GalleryView({ fields, records, imageField, onAddRecord }: Props) {
  // Find the image field and the "title" field (first text field)
  const imgKey = imageField || fields.find((f) => f.field_type === "image")?.field_key;
  const titleField = fields.find((f) => f.field_type === "text");
  const detailFields = fields.filter((f) => f.field_key !== imgKey && f.field_key !== titleField?.field_key).slice(0, 4);

  return (
    <div className="h-full overflow-auto p-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-400">{records.length} enregistrement{records.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {records.map((record) => {
          const imgUrl = imgKey ? (record.data[imgKey] as string) : null;
          const title = titleField ? (record.data[titleField.field_key] as string) : `#${record.sort_order + 1}`;

          return (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 group"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {title && <h3 className="font-semibold text-slate-900 text-sm mb-2 truncate">{title}</h3>}

                {detailFields.map((f) => {
                  const val = record.data[f.field_key];
                  if (val == null || val === "") return null;

                  return (
                    <div key={f.id} className="mb-1.5">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{f.name}</p>
                      <FieldDisplay field={f} value={val} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <button
          onClick={() => onAddRecord()}
          className="bg-white/50 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 flex flex-col items-center justify-center min-h-[250px] text-slate-400 hover:text-blue-600 group"
        >
          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Ajouter</span>
        </button>
      </div>
    </div>
  );
}

// ── Field Display (read-only for gallery cards) ──────────────────────────────

function FieldDisplay({ field, value }: { field: Field; value: unknown }) {
  switch (field.field_type) {
    case "number":
      return <p className="text-sm text-slate-700 font-medium">€{Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</p>;
    case "url":
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
          {String(value).replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}...
        </a>
      );
    case "checkbox":
      return <span className="text-sm">{value ? "✅" : "❌"}</span>;
    case "select": {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
          {String(value)}
        </span>
      );
    }
    default:
      return <p className="text-sm text-slate-700 line-clamp-2">{String(value)}</p>;
  }
}
