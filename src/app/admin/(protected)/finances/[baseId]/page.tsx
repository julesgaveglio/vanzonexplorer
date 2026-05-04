import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SpreadsheetBase from "./_components/SpreadsheetBase";

export const metadata: Metadata = {
  title: "Base — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getBaseData(baseId: string) {
  const sb = createSupabaseAdmin();

  const [baseRes, tablesRes] = await Promise.all([
    sb.from("spreadsheet_bases").select("*").eq("id", baseId).single(),
    sb.from("spreadsheet_tables").select("*").eq("base_id", baseId).order("sort_order"),
  ]);

  if (baseRes.error || !baseRes.data) return null;

  // Load first table's data if exists
  const tables = tablesRes.data || [];
  let firstTableData = null;

  if (tables.length > 0) {
    const [fieldsRes, recordsRes, viewsRes] = await Promise.all([
      sb.from("spreadsheet_fields").select("*").eq("table_id", tables[0].id).order("sort_order"),
      sb.from("spreadsheet_records").select("*").eq("table_id", tables[0].id).order("sort_order"),
      sb.from("spreadsheet_views").select("*").eq("table_id", tables[0].id).order("sort_order"),
    ]);
    firstTableData = {
      fields: fieldsRes.data || [],
      records: recordsRes.data || [],
      views: viewsRes.data || [],
    };
  }

  return { base: baseRes.data, tables, firstTableData };
}

export default async function BasePage({ params }: { params: Promise<{ baseId: string }> }) {
  const { baseId } = await params;
  const data = await getBaseData(baseId);
  if (!data) notFound();

  return (
    <SpreadsheetBase
      base={data.base}
      initialTables={data.tables}
      initialTableData={data.firstTableData}
    />
  );
}
