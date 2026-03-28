import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import BacklinksClient from "./_components/BacklinksClient";

export const metadata: Metadata = {
  title: "Backlinks SEO — Admin Vanzon",
  robots: { index: false, follow: false },
};

async function getBacklinksData() {
  const supabase = createSupabaseAdmin();

  const [prospectsResult, outreachResult, obtainedResult] = await Promise.all([
    supabase
      .from("backlink_prospects")
      .select("*")
      .order("score", { ascending: false }),
    supabase
      .from("backlink_outreach")
      .select("*, backlink_prospects(domain, url, type)")
      .order("created_at", { ascending: false }),
    supabase
      .from("backlink_obtained")
      .select("*, backlink_prospects(domain)")
      .order("date_obtained", { ascending: false }),
  ]);

  return {
    prospects: prospectsResult.data || [],
    outreach: outreachResult.data || [],
    obtained: obtainedResult.data || [],
  };
}

export default async function BacklinksPage() {
  const data = await getBacklinksData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Système / SEO</p>
        <h1 className="text-3xl font-black text-slate-900">Backlinks SEO</h1>
        <p className="text-slate-500 mt-1">Discovery, outreach et suivi des backlinks obtenus</p>
      </div>
      <BacklinksClient initialData={data} />
    </div>
  );
}
