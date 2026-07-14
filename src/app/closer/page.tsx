import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ClosingAnalysisRow } from "@/types/closing-analysis";
import CloserApp from "./CloserApp";

export const dynamic = "force-dynamic";

async function getHistory(): Promise<ClosingAnalysisRow[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("closing_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // Table pas encore créée : on démarre avec un historique vide.
      console.warn("[closer] historique indisponible:", error.message);
      return [];
    }
    return (data as ClosingAnalysisRow[]) ?? [];
  } catch (e) {
    console.warn("[closer] Supabase indisponible:", e);
    return [];
  }
}

export default async function CloserPage() {
  const history = await getHistory();
  return <CloserApp initialHistory={history} />;
}
