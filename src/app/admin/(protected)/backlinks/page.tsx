import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import BacklinksClient from "./_components/BacklinksClient";
import { AdminPageHeader } from "@/app/admin/_components/ui";

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
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Backlinks SEO"
        subtitle="Discovery, outreach et suivi des backlinks obtenus"
      />
      <BacklinksClient initialData={data} />
    </div>
  );
}
