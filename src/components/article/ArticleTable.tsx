import React from "react";
import { renderInlineMarkdown, getBlockText, type PortableBlock } from "@/lib/article-utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export type VirtualBlock =
  | PortableBlock
  | { _type: "table"; _key: string; rows: string[] };

// ── ArticleTable component ─────────────────────────────────────────────────────

export function ArticleTable({ rows }: { rows: string[] }) {
  const parseRow = (row: string) =>
    row
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

  // Filter out separator rows (| :--- | --- | :---: |)
  const dataRows = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r.replace(/\s/g, "")));
  if (dataRows.length === 0) return null;

  const headerCells = parseRow(dataRows[0]);
  const bodyRows = dataRows.slice(1).map(parseRow);

  return (
    <div className="overflow-x-auto my-8 rounded-2xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headerCells.map((cell, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/60 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-600 align-top">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pre-process: group consecutive table rows into virtual table blocks ─────────

export function groupTableBlocks(blocks: PortableBlock[]): VirtualBlock[] {
  const result: VirtualBlock[] = [];
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      result.push({
        _type: "table" as const,
        _key: Math.random().toString(36).slice(2),
        rows: [...tableRows],
      });
      tableRows = [];
    }
  };

  for (const block of blocks) {
    const text = getBlockText(block);
    const isTableRow =
      block._type === "block" &&
      block.style === "normal" &&
      text.trimStart().startsWith("|");
    if (isTableRow) {
      tableRows.push(text);
    } else {
      flushTable();
      result.push(block);
    }
  }
  flushTable();
  return result;
}
