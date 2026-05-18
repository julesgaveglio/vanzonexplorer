import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export default async function VanzonAppDashboard() {
  const supabase = createSupabaseAdmin();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const today = now.toISOString().split("T")[0];

  // Fetch stats in parallel
  const [confirmedRes, inProgressRes, monthRevenueRes, totalRevenueRes] =
    await Promise.all([
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("start_date", today),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("reservations")
        .select("revenue")
        .gte("start_date", monthStart),
      supabase.from("reservations").select("revenue"),
    ]);

  const upcoming = confirmedRes.count ?? 0;
  const inProgress = inProgressRes.count ?? 0;

  const monthRevenue = (monthRevenueRes.data ?? []).reduce(
    (sum, r) => sum + (r.revenue ?? 0),
    0
  );
  const totalRevenue = (totalRevenueRes.data ?? []).reduce(
    (sum, r) => sum + (r.revenue ?? 0),
    0
  );

  // Format date in French
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stats = [
    { label: "Reservations a venir", value: upcoming, prefix: "" },
    { label: "En cours", value: inProgress, prefix: "" },
    {
      label: "Revenus du mois",
      value: monthRevenue.toLocaleString("fr-FR"),
      prefix: "",
      suffix: " EUR",
    },
    {
      label: "Total revenus",
      value: totalRevenue.toLocaleString("fr-FR"),
      prefix: "",
      suffix: " EUR",
    },
  ];

  return (
    <main className="px-5 pt-14 pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Vanzon Explorer
        </h1>
        <p className="text-sm text-slate-500 mt-1 capitalize">{dateStr}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl px-5 py-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-blue-600">
              {stat.prefix}
              {stat.value}
              {stat.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* CTA card */}
      <Link href="/vanzon-app/reservations" className="block">
        <div className="glass-card glass-card-hover rounded-2xl px-5 py-6 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Voir les reservations
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Gerer vos locations en cours
            </p>
          </div>
          <span className="text-blue-600 text-xl font-bold">&rarr;</span>
        </div>
      </Link>
    </main>
  );
}
