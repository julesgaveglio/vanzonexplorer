import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/app/admin/_components/ui";
import FinancesClient from "./_components/FinancesClient";

export const metadata: Metadata = {
  title: "Finances — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getFinanceData() {
  const sb = createSupabaseAdmin();

  const [transRes, catRes, listRes] = await Promise.all([
    sb
      .from("finance_transactions")
      .select("*, finance_categories(name, icon, color)")
      .order("date", { ascending: false })
      .limit(200),
    sb
      .from("finance_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    sb
      .from("shopping_lists")
      .select("*, shopping_items(*)")
      .order("created_at", { ascending: false }),
  ]);

  return {
    transactions: transRes.data || [],
    categories: catRes.data || [],
    shoppingLists: listRes.data || [],
  };
}

export default async function FinancesPage() {
  const data = await getFinanceData();

  return (
    <div>
      <AdminPageHeader
        title="Finances"
        subtitle="Depenses, revenus et listes de courses — toutes les donnees financieres Vanzon"
      />
      <FinancesClient
        initialTransactions={data.transactions}
        categories={data.categories}
        initialShoppingLists={data.shoppingLists}
      />
    </div>
  );
}
