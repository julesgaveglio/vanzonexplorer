import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/app/admin/_components/ui";

export const metadata: Metadata = {
  title: "Leads Propriétaires — Vanzon Admin",
  robots: { index: false, follow: false },
};

interface VanOwnerLead {
  id: string;
  first_name: string;
  email: string;
  van_type: "fourgon" | "minibus" | "autre";
  location: string;
  status: "pending" | "contacted" | "interested" | "rejected";
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    contacted: "bg-blue-100 text-blue-800 border border-blue-200",
    interested: "bg-green-100 text-green-800 border border-green-200",
    rejected: "bg-red-100 text-red-800 border border-red-200",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    contacted: "Contacté",
    interested: "Intéressé",
    rejected: "Refusé",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

const VAN_TYPE_LABELS: Record<string, string> = {
  fourgon: "Fourgon aménagé",
  minibus: "Minibus / Combi",
  autre: "Autre",
};

export default async function VanOwnerLeadsPage() {
  const supabase = createSupabaseAdmin();
  const { data: leads, error } = await supabase
    .from("van_owner_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (leads ?? []) as VanOwnerLead[];

  const stats = {
    total: items.length,
    pending: items.filter((l) => l.status === "pending").length,
    contacted: items.filter((l) => l.status === "contacted").length,
    interested: items.filter((l) => l.status === "interested").length,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <AdminPageHeader
        title="Leads Propriétaires"
        subtitle="Propriétaires de vans inscrits via le formulaire /proprietaire"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-50 text-slate-900" },
          { label: "En attente", value: stats.pending, color: "bg-yellow-50 text-yellow-800" },
          { label: "Contactés", value: stats.contacted, color: "bg-blue-50 text-blue-800" },
          { label: "Intéressés", value: stats.interested, color: "bg-green-50 text-green-800" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Erreur de chargement : {error.message}
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🚐</div>
          <p className="font-medium">Aucun lead pour le moment</p>
          <p className="text-sm mt-1">
            Les inscriptions via /proprietaire apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Prénom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Localisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lead.first_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <a
                      href={`mailto:${lead.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {VAN_TYPE_LABELS[lead.van_type] ?? lead.van_type}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.location}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
