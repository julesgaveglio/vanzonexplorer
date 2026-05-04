import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import SpreadsheetHome from "./_components/SpreadsheetHome";

export const metadata: Metadata = {
  title: "Finances — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getBases() {
  const sb = createSupabaseAdmin();
  const { data } = await sb
    .from("spreadsheet_bases")
    .select("*, spreadsheet_tables(id)")
    .order("updated_at", { ascending: false });
  return data || [];
}

export default async function FinancesPage() {
  const bases = await getBases();
  return <SpreadsheetHome initialBases={bases} />;
}
