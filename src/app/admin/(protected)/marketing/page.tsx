import { createSupabaseAdmin } from "@/lib/supabase/server";
import MarketingClient from "./MarketingClient";

export default async function MarketingPage() {
  const supabase = createSupabaseAdmin();

  const { data: latestReport } = await supabase
    .from("cmo_reports")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: topActions } = await supabase
    .from("cmo_actions")
    .select("*")
    .neq("status", "done")
    .order("ice_score", { ascending: false })
    .limit(3);

  const { data: allReports } = await supabase
    .from("cmo_reports")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: allActions } = await supabase
    .from("cmo_actions")
    .select("*")
    .order("ice_score", { ascending: false });

  return (
    <MarketingClient
      latestReport={latestReport ?? null}
      topActions={topActions ?? []}
      allReports={allReports ?? []}
      allActions={allActions ?? []}
    />
  );
}
